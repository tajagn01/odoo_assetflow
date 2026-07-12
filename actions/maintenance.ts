"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role, MaintenanceStatus, MaintenancePriority, AssetStatus } from "@prisma/client";
import { ActionResponse } from "./auth";

// Fetch maintenance requests
export async function getMaintenanceRequests() {
  try {
    const session = await auth();
    if (!session) return [];

    const role = session.user.role;
    const whereClause: any = {};

    if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (!deptId) return [];
      whereClause.OR = [
        { raisedBy: { departmentId: deptId } },
        { asset: { departmentId: deptId } }
      ];
    } else if (role === "EMPLOYEE") {
      whereClause.raisedById = session.user.id;
    }

    return await db.maintenanceRequest.findMany({
      where: whereClause,
      include: {
        asset: {
          select: { id: true, tag: true, name: true, status: true, departmentId: true },
        },
        raisedBy: {
          select: { id: true, name: true, email: true, departmentId: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch maintenance requests:", error);
    return [];
  }
}

// Raise a maintenance request (Any Employee)
export async function createMaintenanceRequest(data: {
  assetId: string;
  issueDescription: string;
  priority: MaintenancePriority;
  photoUrl?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!data.assetId || !data.issueDescription.trim()) {
      return { success: false, message: "Asset and description of issue are required." };
    }

    const request = await db.maintenanceRequest.create({
      data: {
        assetId: data.assetId,
        raisedById: session.user.id,
        issueDescription: data.issueDescription.trim(),
        priority: data.priority,
        status: MaintenanceStatus.PENDING,
        photoUrl: data.photoUrl || null,
      },
    });

    // Write activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "RAISE_MAINTENANCE",
        entityType: "MaintenanceRequest",
        entityId: request.id,
        newValues: request,
      },
    });

    return { success: true, message: "Maintenance request filed successfully.", data: request };
  } catch (error) {
    console.error("Failed to raise maintenance request:", error);
    return { success: false, message: "Failed to raise maintenance request." };
  }
}

// Transition maintenance state (Asset Managers / Admins)
export async function transitionMaintenance(data: {
  requestId: string;
  status: MaintenanceStatus;
  technicianName?: string;
  resolutionNotes?: string;
  repairCost?: number;
  estimatedCompletionDate?: string;
  repairAttachments?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
      return { success: false, message: "Unauthorized. Manager role required." };
    }

    const current = await db.maintenanceRequest.findUnique({
      where: { id: data.requestId },
      include: { asset: true },
    });

    if (!current) {
      return { success: false, message: "Maintenance request not found." };
    }

    const result = await db.$transaction(async (tx) => {
      // Update request details
      const request = await tx.maintenanceRequest.update({
        where: { id: data.requestId },
        data: {
          status: data.status,
          technicianName: data.technicianName !== undefined ? data.technicianName : current.technicianName,
          resolutionNotes: data.resolutionNotes !== undefined ? data.resolutionNotes : current.resolutionNotes,
          repairCost: data.repairCost !== undefined ? data.repairCost : current.repairCost,
          estimatedCompletionDate: data.estimatedCompletionDate ? new Date(data.estimatedCompletionDate) : current.estimatedCompletionDate,
          repairAttachments: data.repairAttachments !== undefined ? data.repairAttachments : current.repairAttachments,
        },
      });

      // Update asset status based on request transition rules:
      if ([MaintenanceStatus.APPROVED, MaintenanceStatus.TECHNICIAN_ASSIGNED, MaintenanceStatus.IN_PROGRESS].includes(data.status as any)) {
        await tx.asset.update({
          where: { id: current.assetId },
          data: { status: AssetStatus.UNDER_MAINTENANCE },
        });
      } else if ([MaintenanceStatus.RESOLVED, MaintenanceStatus.CLOSED].includes(data.status as any)) {
        await tx.asset.update({
          where: { id: current.assetId },
          data: { status: AssetStatus.AVAILABLE },
        });
      }

      // Log action
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: `TRANSITION_MAINTENANCE_${data.status}`,
          entityType: "MaintenanceRequest",
          entityId: data.requestId,
          previousValues: { status: current.status },
          newValues: { status: data.status, repairCost: data.repairCost },
        },
      });

      // Send notification alert to the creator
      await tx.notification.create({
        data: {
          userId: current.raisedById,
          title: `Repair Request Status: ${data.status}`,
          message: `Your maintenance ticket for asset [${current.asset.tag}] ${current.asset.name} has been updated to ${data.status}.`,
          type: "MAINTENANCE",
          metadata: { requestId: data.requestId }
        }
      });

      return request;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: `Maintenance request transitioned to ${data.status}.`, data: result };
  } catch (error: any) {
    console.error("Failed to transition maintenance:", error);
    return { success: false, message: error.message || "Failed to update maintenance request." };
  }
}

"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AuditStatus, AuditVerification, AssetStatus } from "@prisma/client";
import { ActionResponse } from "./auth";

async function verifyAuthorized(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

// Fetch all audit cycles
export async function getAuditCycles() {
  try {
    return await db.auditCycle.findMany({
      include: {
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch audit cycles:", error);
    return [];
  }
}

// Create an Audit Cycle and snapshot all active assets into it
export async function createAuditCycle(data: {
  name: string;
  startDate: string;
  endDate: string;
}): Promise<ActionResponse> {
  try {
    const adminId = await verifyAuthorized();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin role required." };
    }

    if (!data.name.trim() || !data.startDate || !data.endDate) {
      return { success: false, message: "Name, start date, and end date are required." };
    }

    const start = new Date(data.startDate);
    const end = new Date(data.endDate);

    if (start >= end) {
      return { success: false, message: "End date must be after start date." };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Create Cycle
      const cycle = await tx.auditCycle.create({
        data: {
          name: data.name.trim(),
          startDate: start,
          endDate: end,
          status: AuditStatus.ACTIVE,
        },
      });

      // 2. Snapshot all active (non-deleted) assets in the database as audit items
      const assets = await tx.asset.findMany({
        where: { deletedAt: null },
      });

      if (assets.length > 0) {
        await tx.auditItem.createMany({
          data: assets.map((asset) => ({
            auditCycleId: cycle.id,
            assetId: asset.id,
            status: AuditVerification.MISSING, // Default status is missing until auditor verifies
          })),
        });
      }

      // 3. Assign creator as initial auditor
      await tx.auditor.create({
        data: {
          auditCycleId: cycle.id,
          userId: adminId,
        },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: "CREATE_AUDIT_CYCLE",
          entityType: "AuditCycle",
          entityId: cycle.id,
          newValues: { cycleId: cycle.id, itemCount: assets.length },
        },
      });

      return cycle;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Audit cycle activated. All active assets snapshotted.", data: result };
  } catch (error: any) {
    console.error("Failed to create audit cycle:", error);
    return { success: false, message: error.message || "Failed to create audit cycle." };
  }
}

// Fetch items in a cycle
export async function getAuditCycleDetails(cycleId: string) {
  try {
    return await db.auditCycle.findUnique({
      where: { id: cycleId },
      include: {
        auditors: { include: { user: { select: { id: true, name: true } } } },
        items: {
          include: {
            asset: { select: { id: true, tag: true, name: true, location: true, status: true, condition: true } },
            verifiedBy: { select: { id: true, name: true } },
          },
          orderBy: { asset: { tag: "asc" } },
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch cycle details:", error);
    return null;
  }
}

// Auditor verifies an individual asset
export async function verifyAuditItem(data: {
  itemId: string;
  status: AuditVerification;
  discrepancyNotes?: string;
}): Promise<ActionResponse> {
  try {
    const auditorId = await verifyAuthorized();
    if (!auditorId) {
      return { success: false, message: "Unauthorized. Auditor role required." };
    }

    const currentItem = await db.auditItem.findUnique({
      where: { id: data.itemId },
      include: { auditCycle: true },
    });

    if (!currentItem) {
      return { success: false, message: "Audit item not found." };
    }

    // Business rule: Closed cycles cannot be edited
    if (currentItem.auditCycle.status === AuditStatus.CLOSED) {
      return { success: false, message: "This audit cycle is closed and locked." };
    }

    const updated = await db.auditItem.update({
      where: { id: data.itemId },
      data: {
        status: data.status,
        discrepancyNotes: data.discrepancyNotes || null,
        verifiedById: auditorId,
        verifiedAt: new Date(),
      },
    });

    return { success: true, message: "Asset verification logged successfully.", data: updated };
  } catch (error) {
    console.error("Failed to verify audit item:", error);
    return { success: false, message: "Failed to verify asset." };
  }
}

// Close Audit Cycle: Lock cycle and transition confirmed missing assets to LOST
export async function closeAuditCycle(cycleId: string): Promise<ActionResponse> {
  try {
    const adminId = await verifyAuthorized();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin role required." };
    }

    const cycle = await db.auditCycle.findUnique({
      where: { id: cycleId },
      include: { items: true },
    });

    if (!cycle) {
      return { success: false, message: "Audit cycle not found." };
    }

    if (cycle.status === AuditStatus.CLOSED) {
      return { success: false, message: "Audit cycle is already closed." };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Lock the cycle status
      const updatedCycle = await tx.auditCycle.update({
        where: { id: cycleId },
        data: { status: AuditStatus.CLOSED },
      });

      // 2. Fetch all missing items inside this cycle
      const missingItems = cycle.items.filter((item) => item.status === AuditVerification.MISSING);

      // Business Rule: Missing assets become Lost after confirmation
      if (missingItems.length > 0) {
        const assetIds = missingItems.map((item) => item.assetId);

        // Update all these assets' status to LOST in the main registry
        await tx.asset.updateMany({
          where: { id: { in: assetIds } },
          data: { status: AssetStatus.LOST },
        });

        // Create notification alerts for the missing items
        for (const assetId of assetIds) {
          const asset = await tx.asset.findUnique({ where: { id: assetId } });
          if (asset) {
            // Write notification
            await tx.notification.create({
              data: {
                userId: adminId, // notify admin
                title: "Asset Marked Lost",
                message: `Asset ${asset.name} (${asset.tag}) was confirmed missing in audit "${cycle.name}" and has been marked as LOST.`,
              },
            });
          }
        }
      }

      // 3. Log cycle close
      await tx.activityLog.create({
        data: {
          userId: adminId,
          action: "CLOSE_AUDIT_CYCLE",
          entityType: "AuditCycle",
          entityId: cycleId,
          newValues: { missingAssetsCount: missingItems.length },
        },
      });

      return updatedCycle;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Audit cycle locked and closed. Discrepancy report compiled.", data: result };
  } catch (error) {
    console.error("Failed to close audit cycle:", error);
    return { success: false, message: "Failed to close audit cycle." };
  }
}

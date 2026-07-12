"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActionResponse } from "./auth";
import { MaintenanceStatus, MaintenancePriority } from "@prisma/client";
import { z } from "zod";

const scheduleSchema = z.object({
  assetId: z.string().min(1, "Asset selection is required."),
  maintenanceType: z.string().min(2, "Maintenance Type must be at least 2 characters."),
  frequency: z.enum(["WEEKLY", "MONTHLY", "QUARTERLY", "EVERY_6_MONTHS", "YEARLY", "CUSTOM"]),
  customIntervalDays: z.number().nullable().optional(),
  nextDueDate: z.string().min(1, "Next Due Date is required."),
  technician: z.string().min(2, "Technician name is required."),
  estimatedCost: z.number().nonnegative("Estimated Cost must be a positive number."),
  checklist: z.array(z.string()).default([]),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "PAUSED", "INACTIVE"]).default("ACTIVE"),
});

// Reusable role-check helper
async function verifySchedulerPermissions(): Promise<string | null> {
  const session = await auth();
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

export async function getMaintenanceSchedules(filters?: {
  assetId?: string;
  status?: string;
}) {
  try {
    const session = await auth();
    if (!session) return [];

    const role = session.user.role;
    const userId = session.user.id;
    const whereClause: any = {};

    if (filters?.assetId) {
      whereClause.assetId = filters.assetId;
    }
    if (filters?.status) {
      whereClause.status = filters.status;
    }

    // Security: Employees can only view schedules for assets assigned to them.
    if (role === "EMPLOYEE") {
      whereClause.asset = { currentHolderId: userId };
    } else if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (deptId) {
        whereClause.asset = { departmentId: deptId };
      }
    }

    const schedules = await db.maintenanceSchedule.findMany({
      where: whereClause,
      include: {
        asset: {
          select: {
            id: true,
            tag: true,
            name: true,
            status: true,
            currentHolderId: true,
            departmentId: true,
          },
        },
      },
      orderBy: { nextDueDate: "asc" },
    });

    // Format decimals
    return JSON.parse(
      JSON.stringify(
        schedules.map((s) => ({
          ...s,
          estimatedCost: Number(s.estimatedCost.toString()),
        }))
      )
    );
  } catch (error) {
    console.error("Failed to fetch maintenance schedules:", error);
    return [];
  }
}

export async function createMaintenanceSchedule(rawInput: unknown): Promise<ActionResponse> {
  try {
    const userId = await verifySchedulerPermissions();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const parsed = scheduleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors as any,
      };
    }

    const data = parsed.data;
    const schedule = await db.maintenanceSchedule.create({
      data: {
        assetId: data.assetId,
        maintenanceType: data.maintenanceType.trim(),
        frequency: data.frequency,
        customIntervalDays: data.frequency === "CUSTOM" ? data.customIntervalDays || 30 : null,
        nextDueDate: new Date(data.nextDueDate),
        technician: data.technician.trim(),
        estimatedCost: data.estimatedCost,
        checklist: data.checklist,
        notes: data.notes?.trim() || null,
        status: data.status,
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "CREATE_PREVENTIVE_SCHEDULE",
        entityType: "MaintenanceSchedule",
        entityId: schedule.id,
        newValues: JSON.parse(JSON.stringify(schedule)),
      },
    });

    return { success: true, message: "Preventive maintenance schedule created.", data: schedule };
  } catch (error) {
    console.error("Failed to create maintenance schedule:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateMaintenanceSchedule(scheduleId: string, rawInput: unknown): Promise<ActionResponse> {
  try {
    const userId = await verifySchedulerPermissions();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const parsed = scheduleSchema.safeParse(rawInput);
    if (!parsed.success) {
      return {
        success: false,
        message: "Validation failed.",
        errors: parsed.error.flatten().fieldErrors as any,
      };
    }

    const current = await db.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!current) {
      return { success: false, message: "Schedule not found." };
    }

    const data = parsed.data;
    const updated = await db.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: {
        maintenanceType: data.maintenanceType.trim(),
        frequency: data.frequency,
        customIntervalDays: data.frequency === "CUSTOM" ? data.customIntervalDays || 30 : null,
        nextDueDate: new Date(data.nextDueDate),
        technician: data.technician.trim(),
        estimatedCost: data.estimatedCost,
        checklist: data.checklist,
        notes: data.notes?.trim() || null,
        status: data.status,
      },
    });

    // Write Activity Log with Before/After
    await db.activityLog.create({
      data: {
        userId,
        action: "UPDATE_PREVENTIVE_SCHEDULE",
        entityType: "MaintenanceSchedule",
        entityId: scheduleId,
        previousValues: JSON.parse(JSON.stringify(current)),
        newValues: JSON.parse(JSON.stringify(updated)),
      },
    });

    return { success: true, message: "Preventive maintenance schedule updated.", data: updated };
  } catch (error) {
    console.error("Failed to update maintenance schedule:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deleteMaintenanceSchedule(scheduleId: string): Promise<ActionResponse> {
  try {
    const userId = await verifySchedulerPermissions();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const current = await db.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!current) {
      return { success: false, message: "Schedule not found." };
    }

    await db.maintenanceSchedule.delete({
      where: { id: scheduleId },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "DELETE_PREVENTIVE_SCHEDULE",
        entityType: "MaintenanceSchedule",
        entityId: scheduleId,
        previousValues: { id: current.id, type: current.maintenanceType },
      },
    });

    return { success: true, message: "Preventive maintenance schedule deleted successfully." };
  } catch (error) {
    console.error("Failed to delete maintenance schedule:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateScheduleStatus(scheduleId: string, status: "ACTIVE" | "PAUSED" | "INACTIVE"): Promise<ActionResponse> {
  try {
    const userId = await verifySchedulerPermissions();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const current = await db.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
    });

    if (!current) {
      return { success: false, message: "Schedule not found." };
    }

    const updated = await db.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: { status },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "UPDATE_PREVENTIVE_SCHEDULE",
        entityType: "MaintenanceSchedule",
        entityId: scheduleId,
        previousValues: { id: current.id, status: current.status },
        newValues: { id: updated.id, status: updated.status },
      },
    });

    return { success: true, message: `Schedule status updated to ${status}.`, data: updated };
  } catch (error) {
    console.error("Failed to update schedule status:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function performScheduledMaintenance(
  scheduleId: string,
  data: {
    actualCost: number;
    technicianName: string;
    checklistResults: string[];
    resolutionNotes: string;
  }
): Promise<ActionResponse> {
  try {
    const userId = await verifySchedulerPermissions();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const schedule = await db.maintenanceSchedule.findUnique({
      where: { id: scheduleId },
      include: { asset: true },
    });

    if (!schedule) {
      return { success: false, message: "Schedule not found." };
    }

    const today = new Date();

    // 1. Create a resolved MaintenanceRequest in history logs
    const historyTicket = await db.maintenanceRequest.create({
      data: {
        assetId: schedule.assetId,
        raisedById: userId,
        issueDescription: `Preventive Maintenance: ${schedule.maintenanceType}. Checklist: ${data.checklistResults.join(", ")}. Notes: ${data.resolutionNotes}`,
        priority: MaintenancePriority.MEDIUM,
        status: MaintenanceStatus.CLOSED, // mark closed since it is completed immediately
        technicianName: data.technicianName || schedule.technician,
        repairCost: data.actualCost,
        resolutionNotes: "Completed preventive maintenance cycle successfully.",
      },
    });

    // Calculate next due date
    const nextDate = new Date(schedule.nextDueDate);
    const freq = schedule.frequency;

    if (freq === "WEEKLY") {
      nextDate.setDate(nextDate.getDate() + 7);
    } else if (freq === "MONTHLY") {
      nextDate.setMonth(nextDate.getMonth() + 1);
    } else if (freq === "QUARTERLY") {
      nextDate.setMonth(nextDate.getMonth() + 3);
    } else if (freq === "EVERY_6_MONTHS") {
      nextDate.setMonth(nextDate.getMonth() + 6);
    } else if (freq === "YEARLY") {
      nextDate.setFullYear(nextDate.getFullYear() + 1);
    } else if (freq === "CUSTOM" && schedule.customIntervalDays) {
      nextDate.setDate(nextDate.getDate() + schedule.customIntervalDays);
    } else {
      nextDate.setMonth(nextDate.getMonth() + 1);
    }

    // 2. Update the Schedule next due date and last maintenance date
    const updatedSchedule = await db.maintenanceSchedule.update({
      where: { id: scheduleId },
      data: {
        lastMaintenanceDate: today,
        nextDueDate: nextDate,
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "PERFORM_PREVENTIVE_MAINTENANCE",
        entityType: "MaintenanceSchedule",
        entityId: scheduleId,
        newValues: {
          historyTicketId: historyTicket.id,
          lastMaintenanceDate: today,
          nextDueDate: nextDate,
        },
      },
    });

    return { 
      success: true, 
      message: `Preventive maintenance logged. Next due date: ${nextDate.toLocaleDateString()}`,
      data: updatedSchedule 
    };
  } catch (error) {
    console.error("Failed to perform scheduled maintenance:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

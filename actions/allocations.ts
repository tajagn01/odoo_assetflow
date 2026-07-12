"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AssetStatus, AllocationStatus, AssetCondition } from "@prisma/client";
import { ActionResponse } from "./auth";

async function verifyAuthorized(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

function serializeAsset(asset: any) {
  if (!asset) return null;
  return {
    ...asset,
    acquisitionCost: asset.acquisitionCost ? Number(asset.acquisitionCost.toString()) : 0,
  };
}

// Allocate asset to employee or department
export async function allocateAsset(data: {
  assetId: string;
  targetUserId: string;
  expectedReturnDate?: string | null;
}): Promise<ActionResponse> {
  try {
    const adminOrManagerId = await verifyAuthorized();
    if (!adminOrManagerId) {
      return { success: false, message: "Unauthorized. Admin or Asset Manager role required." };
    }

    if (!data.assetId || !data.targetUserId) {
      return { success: false, message: "Asset ID and Target Employee are required." };
    }

    const result = await db.$transaction(async (tx) => {
      // Find asset
      const asset = await tx.asset.findUnique({
        where: { id: data.assetId },
        include: {
          currentHolder: true,
        },
      });

      if (!asset || asset.deletedAt !== null) {
        throw new Error("Asset not found in directory.");
      }

      // Conflict rule: You can't allocate an asset that's already taken.
      if (asset.status !== AssetStatus.AVAILABLE) {
        const holderName = asset.currentHolder?.name || "another employee";
        throw new Error(`Asset is already taken! Currently held by ${holderName}.`);
      }

      // Create new active allocation
      const allocation = await tx.allocation.create({
        data: {
          assetId: data.assetId,
          userId: data.targetUserId,
          allocatedById: adminOrManagerId,
          expectedReturnDate: data.expectedReturnDate ? new Date(data.expectedReturnDate) : null,
          conditionOnAllocation: asset.condition,
          status: AllocationStatus.ACTIVE,
        },
      });

      // Update asset status
      await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: AssetStatus.ALLOCATED,
          currentHolderId: data.targetUserId,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: adminOrManagerId,
          action: "ALLOCATE_ASSET",
          entityType: "Asset",
          entityId: data.assetId,
          newValues: { allocationId: allocation.id, targetUserId: data.targetUserId },
        },
      });

      // Notify the recipient
      await tx.notification.create({
        data: {
          userId: data.targetUserId,
          title: "Asset Allocated",
          message: `Asset [${asset.tag}] ${asset.name} has been allocated to you. Expected return: ${data.expectedReturnDate ? new Date(data.expectedReturnDate).toLocaleDateString() : "N/A"}`,
          type: "ALLOCATION",
          metadata: { allocationId: allocation.id }
        } as any
      });

      return allocation;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Asset allocated successfully.", data: result };
  } catch (error: any) {
    console.error("Failed to allocate asset:", error);
    return { success: false, message: error.message || "Failed to allocate asset." };
  }
}

// Return asset to Available status
export async function returnAsset(data: {
  assetId: string;
  conditionOnReturn: AssetCondition;
  checkInNotes?: string;
}): Promise<ActionResponse> {
  try {
    const adminOrManagerId = await verifyAuthorized();
    if (!adminOrManagerId) {
      return { success: false, message: "Unauthorized. Admin or Asset Manager role required." };
    }

    if (!data.assetId || !data.conditionOnReturn) {
      return { success: false, message: "Asset ID and return condition are required." };
    }

    const result = await db.$transaction(async (tx) => {
      // Find active allocation
      const activeAlloc = await tx.allocation.findFirst({
        where: { assetId: data.assetId, status: AllocationStatus.ACTIVE },
      });

      if (!activeAlloc) {
        throw new Error("No active allocation found for this asset.");
      }

      const currentHolderId = activeAlloc.userId;

      // Close the allocation
      await tx.allocation.update({
        where: { id: activeAlloc.id },
        data: {
          status: AllocationStatus.CLOSED,
          actualReturnDate: new Date(),
          conditionOnReturn: data.conditionOnReturn,
          checkInNotes: data.checkInNotes || null,
        },
      });

      // Reset asset back to Available
      const asset = await tx.asset.update({
        where: { id: data.assetId },
        data: {
          status: AssetStatus.AVAILABLE,
          condition: data.conditionOnReturn,
          currentHolderId: null,
        },
      });

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: adminOrManagerId,
          action: "RETURN_ASSET",
          entityType: "Asset",
          entityId: data.assetId,
          newValues: { allocationId: activeAlloc.id, condition: data.conditionOnReturn },
        },
      });

      // Notify return
      await tx.notification.create({
        data: {
          userId: currentHolderId,
          title: "Asset Returned",
          message: `Asset [${asset.tag}] ${asset.name} has been returned.`,
          type: "RETURN",
          metadata: { assetId: data.assetId }
        } as any
      });

      return asset;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Asset returned to directory. Status set to Available.", data: serializeAsset(result) };
  } catch (error: any) {
    console.error("Failed to return asset:", error);
    return { success: false, message: error.message || "Failed to complete asset return." };
  }
}

// Get list of active employees for transfer target dropdown
export async function getTransferTargets(): Promise<{ id: string; name: string; email: string; department: string | null }[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const users = await db.user.findMany({
      where: {
        status: "ACTIVE",
        id: { not: session.user.id }, // Exclude the current user
      },
      select: {
        id: true,
        name: true,
        email: true,
        department: {
          select: { name: true },
        },
      },
      orderBy: { name: "asc" },
    });

    return users.map((u) => ({
      id: u.id,
      name: u.name,
      email: u.email,
      department: u.department?.name || null,
    }));
  } catch (error) {
    console.error("Failed to fetch transfer targets:", error);
    return [];
  }
}

// Request Direct User-to-User Transfer (V1.1 Flow / Employee initiated)
export async function requestAssetTransfer(data: {
  assetId: string;
  targetUserId: string;
}): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    const asset = await db.asset.findUnique({
      where: { id: data.assetId },
      include: {
        currentHolder: true,
        department: { select: { managerId: true, name: true } },
      },
    });

    if (!asset || asset.deletedAt !== null) {
      return { success: false, message: "Asset not found." };
    }

    if (asset.status !== AssetStatus.ALLOCATED || !asset.currentHolderId) {
      return { success: false, message: "Asset is not currently allocated to anyone." };
    }

    const targetUser = await db.user.findUnique({
      where: { id: data.targetUserId },
      select: { id: true, name: true, email: true },
    });

    if (!targetUser) {
      return { success: false, message: "Target recipient not found." };
    }

    // Enforce role checks
    const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

    if (isPowerUser) {
      // Instant Transfer execution under single transaction
      const result = await db.$transaction(async (tx) => {
        // 1. Close current allocation
        await tx.allocation.updateMany({
          where: { assetId: data.assetId, status: AllocationStatus.ACTIVE },
          data: { status: AllocationStatus.CLOSED, actualReturnDate: new Date() },
        });

        // 2. Open new allocation
        const newAlloc = await tx.allocation.create({
          data: {
            assetId: data.assetId,
            userId: data.targetUserId,
            allocatedById: session.user.id,
            conditionOnAllocation: asset.condition,
            status: AllocationStatus.ACTIVE,
          },
        });

        // 3. Update asset current holder
        await tx.asset.update({
          where: { id: data.assetId },
          data: { currentHolderId: data.targetUserId },
        });

        // 4. Log transfer
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: "TRANSFER_ASSET",
            entityType: "Asset",
            entityId: data.assetId,
            previousValues: { holderId: asset.currentHolderId },
            newValues: { holderId: data.targetUserId },
          },
        });

        // 5. Notify involved parties
        await tx.notification.create({
          data: {
            userId: data.targetUserId,
            title: "Asset Transferred to You",
            message: `${asset.name} (${asset.tag}) has been transferred to your custody by ${session.user.name}.`,
            type: "TRANSFER_COMPLETED",
            metadata: { assetId: data.assetId, assetTag: asset.tag, assetName: asset.name },
          } as any,
        });

        if (asset.currentHolderId) {
          await tx.notification.create({
            data: {
              userId: asset.currentHolderId,
              title: "Asset Transferred Away",
              message: `${asset.name} (${asset.tag}) has been transferred from your custody to ${targetUser.name}.`,
              type: "TRANSFER_COMPLETED",
              metadata: { assetId: data.assetId, assetTag: asset.tag, assetName: asset.name },
            } as any,
          });
        }

        return newAlloc;
      }, { maxWait: 15000, timeout: 20000 });

      return { success: true, message: "Asset transfer approved and executed.", data: result };
    } else {
      // Employees / Dept Heads raise a TRANSFER_REQUEST notification
      // Notify: department head (if exists) + all asset managers + all admins
      const approverIds: string[] = [];

      // Department Head
      if (asset.department?.managerId) {
        approverIds.push(asset.department.managerId);
      }

      // Asset managers and Admins
      const approvers = await db.user.findMany({
        where: {
          status: "ACTIVE",
          role: { in: [Role.ADMIN, Role.ASSET_MANAGER] },
        },
        select: { id: true },
      });

      for (const approver of approvers) {
        if (!approverIds.includes(approver.id)) {
          approverIds.push(approver.id);
        }
      }

      // Create notifications for all approvers
      const transferMetadata = {
        assetId: data.assetId,
        assetTag: asset.tag,
        assetName: asset.name,
        sourceUserId: asset.currentHolderId,
        sourceUserName: asset.currentHolder?.name || "Unknown",
        targetUserId: data.targetUserId,
        targetUserName: targetUser.name,
        requestedById: session.user.id,
        requestedByName: session.user.name,
      };

      await db.$transaction(async (tx) => {
        for (const approverId of approverIds) {
          await tx.notification.create({
            data: {
              userId: approverId,
              title: "Transfer Request Pending Approval",
              message: `${session.user.name} has requested to transfer ${asset.name} (${asset.tag}) from ${asset.currentHolder?.name || "current holder"} to ${targetUser.name}.`,
              type: "TRANSFER_REQUEST",
              metadata: transferMetadata,
            } as any,
          });
        }

        // Log activity
        await tx.activityLog.create({
          data: {
            userId: session.user.id,
            action: "REQUEST_TRANSFER",
            entityType: "Asset",
            entityId: data.assetId,
            newValues: transferMetadata,
          },
        });
      }, { maxWait: 15000, timeout: 20000 });

      return { success: true, message: "Transfer request submitted. Awaiting approval from management." };
    }
  } catch (error: any) {
    console.error("Transfer error:", error);
    return { success: false, message: error.message || "Failed to request transfer." };
  }
}

// Approve a pending transfer request (Admin / Asset Manager / Dept Head)
export async function approveAssetTransfer(notificationId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    // Only power users and dept heads can approve
    if (!["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions to approve transfers." };
    }

    // Find the notification
    const notification = (await db.notification.findUnique({
      where: { id: notificationId },
    })) as any;

    if (!notification || notification.type !== "TRANSFER_REQUEST") {
      return { success: false, message: "Transfer request notification not found." };
    }

    const meta = notification.metadata as any;
    if (!meta?.assetId || !meta?.sourceUserId || !meta?.targetUserId) {
      return { success: false, message: "Invalid transfer request data." };
    }

    // Verify asset is still in correct state
    const asset = await db.asset.findUnique({
      where: { id: meta.assetId },
      include: { currentHolder: true },
    });

    if (!asset || asset.deletedAt !== null) {
      return { success: false, message: "Asset no longer exists." };
    }

    if (asset.status !== AssetStatus.ALLOCATED) {
      return { success: false, message: "Asset is no longer in ALLOCATED state. Transfer cannot proceed." };
    }

    // Execute the transfer
    await db.$transaction(async (tx) => {
      // 1. Close current allocation
      await tx.allocation.updateMany({
        where: { assetId: meta.assetId, status: AllocationStatus.ACTIVE },
        data: { status: AllocationStatus.CLOSED, actualReturnDate: new Date() },
      });

      // 2. Create new allocation
      await tx.allocation.create({
        data: {
          assetId: meta.assetId,
          userId: meta.targetUserId,
          allocatedById: session.user.id,
          conditionOnAllocation: asset.condition,
          status: AllocationStatus.ACTIVE,
        },
      });

      // 3. Update asset holder
      await tx.asset.update({
        where: { id: meta.assetId },
        data: { currentHolderId: meta.targetUserId },
      });

      // 4. Mark ALL matching TRANSFER_REQUEST notifications as read
      await tx.notification.updateMany({
        where: {
          type: "TRANSFER_REQUEST",
          isRead: false,
        } as any,
        data: { isRead: true },
      });

      // Only mark notifications with matching asset/source/target as read
      // For now mark this specific one
      await tx.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      // 5. Notify source and target users
      await tx.notification.create({
        data: {
          userId: meta.targetUserId,
          title: "Transfer Approved — Asset Received",
          message: `${meta.assetName} (${meta.assetTag}) has been transferred to your custody. Approved by ${session.user.name}.`,
          type: "TRANSFER_COMPLETED",
          metadata: { assetId: meta.assetId, assetTag: meta.assetTag, assetName: meta.assetName },
        } as any,
      });

      await tx.notification.create({
        data: {
          userId: meta.sourceUserId,
          title: "Transfer Approved — Asset Handed Over",
          message: `${meta.assetName} (${meta.assetTag}) has been transferred from your custody to ${meta.targetUserName}. Approved by ${session.user.name}.`,
          type: "TRANSFER_COMPLETED",
          metadata: { assetId: meta.assetId, assetTag: meta.assetTag, assetName: meta.assetName },
        } as any,
      });

      if (meta.requestedById && meta.requestedById !== meta.sourceUserId && meta.requestedById !== meta.targetUserId) {
        await tx.notification.create({
          data: {
            userId: meta.requestedById,
            title: "Your Transfer Request Was Approved",
            message: `Transfer of ${meta.assetName} (${meta.assetTag}) has been approved by ${session.user.name}.`,
            type: "TRANSFER_COMPLETED",
            metadata: { assetId: meta.assetId, assetTag: meta.assetTag, assetName: meta.assetName },
          } as any,
        });
      }

      // 6. Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "APPROVE_TRANSFER",
          entityType: "Asset",
          entityId: meta.assetId,
          previousValues: { holderId: meta.sourceUserId },
          newValues: { holderId: meta.targetUserId, approvedBy: session.user.id },
        },
      });
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Transfer approved and executed successfully." };
  } catch (error: any) {
    console.error("Approve transfer error:", error);
    return { success: false, message: error.message || "Failed to approve transfer." };
  }
}

// Decline a pending transfer request
export async function declineAssetTransfer(notificationId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    if (!["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      return { success: false, message: "Insufficient permissions." };
    }

    const notification = (await db.notification.findUnique({
      where: { id: notificationId },
    })) as any;

    if (!notification || notification.type !== "TRANSFER_REQUEST") {
      return { success: false, message: "Transfer request not found." };
    }

    const meta = notification.metadata as any;

    await db.$transaction(async (tx) => {
      // Mark notification as read
      await tx.notification.update({
        where: { id: notificationId },
        data: { isRead: true },
      });

      // Notify the requester
      if (meta?.requestedById) {
        await tx.notification.create({
          data: {
            userId: meta.requestedById,
            title: "Transfer Request Declined",
            message: `Your transfer request for ${meta.assetName || "an asset"} (${meta.assetTag || ""}) has been declined by ${session.user.name}.`,
            type: "TRANSFER_DECLINED",
            metadata: { assetId: meta.assetId, assetTag: meta.assetTag, assetName: meta.assetName },
          } as any,
        });
      }

      // Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "DECLINE_TRANSFER",
          entityType: "Asset",
          entityId: meta?.assetId || "unknown",
          newValues: { declinedBy: session.user.id, reason: "Declined by approver" },
        },
      });
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Transfer request declined." };
  } catch (error: any) {
    console.error("Decline transfer error:", error);
    return { success: false, message: error.message || "Failed to decline transfer." };
  }
}

// Get pending transfer requests for approval (Dept Head / Admin / Asset Manager)
export async function getPendingTransferRequests(): Promise<any[]> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    if (!["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(session.user.role)) {
      return [];
    }

    const notifications = (await db.notification.findMany({
      where: {
        userId: session.user.id,
        type: "TRANSFER_REQUEST",
        isRead: false,
      } as any,
      orderBy: { createdAt: "desc" },
    })) as any[];

    return JSON.parse(JSON.stringify(notifications));
  } catch (error) {
    console.error("Failed to fetch pending transfers:", error);
    return [];
  }
}

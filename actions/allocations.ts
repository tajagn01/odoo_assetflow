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

      return asset;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Asset returned to directory. Status set to Available.", data: serializeAsset(result) };
  } catch (error: any) {
    console.error("Failed to return asset:", error);
    return { success: false, message: error.message || "Failed to complete asset return." };
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
      include: { currentHolder: true },
    });

    if (!asset || asset.deletedAt !== null) {
      return { success: false, message: "Asset not found." };
    }

    if (asset.status !== AssetStatus.ALLOCATED || !asset.currentHolderId) {
      return { success: false, message: "Asset is not currently allocated to anyone." };
    }

    // Enforce role checks or create a pending log (in this MVP, we simulate instant approval if requested by Admin/Manager, else log a transfer transaction)
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

        return newAlloc;
      }, { maxWait: 15000, timeout: 20000 });

      return { success: true, message: "Asset transfer approved and executed.", data: result };
    } else {
      // Employees raise a notification log
      await db.notification.create({
        data: {
          userId: asset.currentHolderId, // notify current holder
          title: "Transfer Request",
          message: `${session.user.name} has requested a transfer for ${asset.name} (${asset.tag}).`,
        },
      });

      return { success: true, message: "Transfer request raised to current holder." };
    }
  } catch (error: any) {
    console.error("Transfer error:", error);
    return { success: false, message: "Failed to request transfer." };
  }
}

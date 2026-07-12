"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AssetStatus, AssetCondition } from "@prisma/client";
import { ActionResponse } from "./auth";

async function verifyAuthorized(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

// ----------------------------------------------------
// SEQUENTIAL TAG GENERATION SERVICE
// ----------------------------------------------------
async function generateAssetTag(tx: any): Promise<string> {
  // Find highest tag to increment sequentially
  const lastAsset = await tx.asset.findFirst({
    where: { tag: { startsWith: "AF-" } },
    orderBy: { tag: "desc" },
    select: { tag: true },
  });

  if (!lastAsset) {
    return "AF-000001";
  }

  const numberPart = lastAsset.tag.replace("AF-", "");
  const nextNum = parseInt(numberPart, 10) + 1;
  const paddedNum = String(nextNum).padStart(6, "0");
  return `AF-${paddedNum}`;
}

// ----------------------------------------------------
// ASSET MUTATIONS
// ----------------------------------------------------

function serializeAsset(asset: any) {
  if (!asset) return null;
  return {
    ...asset,
    acquisitionCost: asset.acquisitionCost ? Number(asset.acquisitionCost.toString()) : 0,
  };
}

export async function createAsset(data: {
  name: string;
  categoryId: string;
  serialNumber: string;
  acquisitionDate: Date;
  acquisitionCost: number;
  condition: AssetCondition;
  location: string;
  images: string[];
  isSharedResource: boolean;
  departmentId?: string | null;
}): Promise<ActionResponse> {
  try {
    const adminOrManagerId = await verifyAuthorized();
    if (!adminOrManagerId) {
      return { success: false, message: "Unauthorized. Asset Manager or Admin privileges required." };
    }

    if (!data.name.trim() || !data.categoryId || !data.serialNumber.trim() || !data.location.trim()) {
      return { success: false, message: "Missing required fields." };
    }

    // Verify category exists
    const category = await db.assetCategory.findUnique({
      where: { id: data.categoryId },
    });
    if (!category) {
      return { success: false, message: "Asset category not found." };
    }

    // Transaction-safe sequential creation
    const result = await db.$transaction(async (tx) => {
      // Check serial uniqueness
      const existing = await tx.asset.findUnique({
        where: { serialNumber: data.serialNumber.trim() },
      });

      if (existing) {
        throw new Error("An asset with this serial number already exists.");
      }

      const generatedTag = await generateAssetTag(tx);

      const asset = await tx.asset.create({
        data: {
          tag: generatedTag,
          name: data.name.trim(),
          categoryId: data.categoryId,
          serialNumber: data.serialNumber.trim(),
          acquisitionDate: new Date(data.acquisitionDate),
          acquisitionCost: data.acquisitionCost,
          condition: data.condition,
          status: AssetStatus.AVAILABLE,
          location: data.location.trim(),
          images: data.images,
          isSharedResource: data.isSharedResource,
          departmentId: data.departmentId || null,
        },
      });

      // Write activity log
      await tx.activityLog.create({
        data: {
          userId: adminOrManagerId,
          action: "CREATE_ASSET",
          entityType: "Asset",
          entityId: asset.id,
          newValues: asset,
        },
      });

      return asset;
    });

    return { success: true, message: `Asset created successfully under tag ${result.tag}.`, data: serializeAsset(result) };
  } catch (error: any) {
    console.error("Failed to create asset:", error);
    return { success: false, message: error.message || "Failed to create asset." };
  }
}

export async function getAssets(filters?: {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  location?: string;
}) {
  try {
    const whereClause: any = { deletedAt: null };

    if (filters?.categoryId) {
      whereClause.categoryId = filters.categoryId;
    }

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.location) {
      whereClause.location = { contains: filters.location, mode: "insensitive" };
    }

    if (filters?.search) {
      whereClause.OR = [
        { name: { contains: filters.search, mode: "insensitive" } },
        { tag: { contains: filters.search, mode: "insensitive" } },
        { serialNumber: { contains: filters.search, mode: "insensitive" } },
        { location: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    const assets = await db.asset.findMany({
      where: whereClause,
      select: {
        id: true,
        tag: true,
        name: true,
        categoryId: true,
        serialNumber: true,
        acquisitionDate: true,
        acquisitionCost: true,
        condition: true,
        status: true,
        currentHolderId: true,
        location: true,
        isSharedResource: true,
        departmentId: true,
        category: {
          select: {
            id: true,
            name: true,
          },
        },
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        currentHolder: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return assets.map(serializeAsset);
  } catch (error) {
    console.error("Failed to fetch assets:", error);
    return [];
  }
}

export async function getAssetDetails(assetId: string) {
  try {
    const asset = await db.asset.findUnique({
      where: { id: assetId },
      include: {
        category: true,
        department: true,
        currentHolder: {
          select: { id: true, name: true, email: true },
        },
        allocations: {
          include: {
            user: { select: { id: true, name: true, email: true } },
            allocatedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        maintenanceReqs: {
          include: {
            raisedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
        bookings: {
          include: {
            user: { select: { id: true, name: true } },
          },
          orderBy: { startTime: "desc" },
        },
      },
    });

    return serializeAsset(asset);
  } catch (error) {
    console.error("Failed to fetch asset details:", error);
    return null;
  }
}

export async function deleteAsset(id: string): Promise<ActionResponse> {
  try {
    const adminOrManagerId = await verifyAuthorized();
    if (!adminOrManagerId) {
      return { success: false, message: "Unauthorized. Asset Manager or Admin privileges required." };
    }

    // Business Rule: Cannot delete allocated asset.
    const asset = await db.asset.findUnique({ where: { id } });
    if (!asset || asset.deletedAt !== null) {
      return { success: false, message: "Asset not found." };
    }

    if (asset.status === AssetStatus.ALLOCATED) {
      return { success: false, message: "Cannot delete asset. It is currently allocated to an employee." };
    }

    const updated = await db.asset.update({
      where: { id },
      data: { deletedAt: new Date(), status: AssetStatus.RETIRED },
    });

    await db.activityLog.create({
      data: {
        userId: adminOrManagerId,
        action: "DELETE_ASSET",
        entityType: "Asset",
        entityId: id,
      },
    });

    return { success: true, message: "Asset retired and removed from directory.", data: serializeAsset(updated) };
  } catch (error) {
    console.error("Failed to delete asset:", error);
    return { success: false, message: "Failed to delete asset." };
  }
}

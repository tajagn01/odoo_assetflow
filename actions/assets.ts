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
    }, { maxWait: 15000, timeout: 20000 });

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
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const role = session.user.role;
    const whereClause: any = { deletedAt: null };

    if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (!deptId) return [];
      whereClause.departmentId = deptId;
    } else if (role === "EMPLOYEE") {
      whereClause.currentHolderId = session.user.id;
    }

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
        auditItems: {
          include: {
            auditCycle: true,
            verifiedBy: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
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

export async function importAssetsAction(assets: Array<{
  name: string;
  categoryId: string;
  serialNumber: string;
  acquisitionDate: string;
  acquisitionCost: number;
  condition: AssetCondition;
  location: string;
  isSharedResource: boolean;
  departmentId?: string | null;
}>): Promise<ActionResponse> {
  try {
    const adminOrManagerId = await verifyAuthorized();
    if (!adminOrManagerId) {
      return { success: false, message: "Unauthorized." };
    }

    if (!assets || assets.length === 0) {
      return { success: false, message: "No assets to import." };
    }

    const result = await db.$transaction(async (tx) => {
      const createdAssets = [];

      for (const item of assets) {
        // Validate uniqueness of serial
        const existing = await tx.asset.findUnique({
          where: { serialNumber: item.serialNumber.trim() },
        });

        if (existing) {
          throw new Error(`Serial number '${item.serialNumber}' already exists.`);
        }

        const tag = await generateAssetTag(tx);
        const asset = await tx.asset.create({
          data: {
            tag,
            name: item.name.trim(),
            categoryId: item.categoryId,
            serialNumber: item.serialNumber.trim(),
            acquisitionDate: new Date(item.acquisitionDate || new Date()),
            acquisitionCost: Number(item.acquisitionCost) || 0,
            condition: item.condition || AssetCondition.NEW,
            status: AssetStatus.AVAILABLE,
            location: item.location.trim() || "Warehouse",
            isSharedResource: Boolean(item.isSharedResource),
            departmentId: item.departmentId || null,
          },
        });

        createdAssets.push(asset);

        await tx.activityLog.create({
          data: {
            userId: adminOrManagerId,
            action: "CREATE_ASSET",
            entityType: "Asset",
            entityId: asset.id,
            newValues: { tag, name: asset.name },
          },
        });
      }

      return createdAssets;
    }, { maxWait: 15000, timeout: 30000 });

    return { success: true, message: `Successfully imported ${result.length} assets.`, data: result.map(serializeAsset) };
  } catch (error: any) {
    console.error("Bulk CSV import failed:", error);
    return { success: false, message: error.message || "Failed to import assets." };
  }
}

// Fetch all activity logs (comments, updates, audits) for a specific asset
export async function getAssetActivityLogs(assetId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    return await db.activityLog.findMany({
      where: {
        entityType: "Asset",
        entityId: assetId,
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch asset logs:", error);
    return [];
  }
}

// Add a comment or internal note to an asset via ActivityLog
export async function addAssetActivityLog(data: {
  assetId: string;
  action: "ADD_COMMENT" | "ADD_NOTE";
  text: string;
}): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    if (!data.text.trim()) {
      return { success: false, message: "Content cannot be empty." };
    }

    const log = await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: data.action,
        entityType: "Asset",
        entityId: data.assetId,
        newValues: { text: data.text.trim() },
      },
    });

    return { success: true, message: "Note/Comment saved successfully.", data: log };
  } catch (error: any) {
    console.error("Failed to write asset log:", error);
    return { success: false, message: "Failed to write log." };
  }
}

// ----------------------------------------------------
// ENTERPRISE BULK ACTIONS
// ----------------------------------------------------

export async function bulkDeleteAssets(assetIds: string[]): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!assetIds || assetIds.length === 0) {
      return { success: false, message: "No assets selected." };
    }

    // Business Rule: Cannot delete allocated assets
    const allocatedCount = await db.asset.count({
      where: { id: { in: assetIds }, status: AssetStatus.ALLOCATED, deletedAt: null }
    });

    if (allocatedCount > 0) {
      return { success: false, message: `Operation rejected. ${allocatedCount} of the selected assets are currently allocated.` };
    }

    const result = await db.$transaction(async (tx) => {
      // Soft delete assets by setting deletedAt
      const updated = await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { deletedAt: new Date() }
      });

      // Write logs
      for (const id of assetIds) {
        await tx.activityLog.create({
          data: {
            userId,
            action: "BULK_DELETE_ASSET",
            entityType: "Asset",
            entityId: id,
          }
        });
      }

      return updated;
    });

    return { success: true, message: `Successfully deleted ${result.count} assets.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to bulk delete assets." };
  }
}

export async function bulkChangeAssetsDept(assetIds: string[], departmentId: string): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!assetIds || assetIds.length === 0) return { success: false, message: "No assets selected." };

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { departmentId: departmentId || null }
      });

      for (const id of assetIds) {
        await tx.activityLog.create({
          data: {
            userId,
            action: "BULK_CHANGE_DEPT",
            entityType: "Asset",
            entityId: id,
            newValues: { departmentId }
          }
        });
      }

      return updated;
    });

    return { success: true, message: `Successfully updated department for ${result.count} assets.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update assets department." };
  }
}

export async function bulkChangeAssetsCategory(assetIds: string[], categoryId: string): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!assetIds || assetIds.length === 0) return { success: false, message: "No assets selected." };

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { categoryId }
      });

      for (const id of assetIds) {
        await tx.activityLog.create({
          data: {
            userId,
            action: "BULK_CHANGE_CATEGORY",
            entityType: "Asset",
            entityId: id,
            newValues: { categoryId }
          }
        });
      }

      return updated;
    });

    return { success: true, message: `Successfully updated category for ${result.count} assets.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update assets category." };
  }
}

export async function bulkChangeAssetsStatus(assetIds: string[], status: AssetStatus): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!assetIds || assetIds.length === 0) return { success: false, message: "No assets selected." };

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { status }
      });

      for (const id of assetIds) {
        await tx.activityLog.create({
          data: {
            userId,
            action: "BULK_CHANGE_STATUS",
            entityType: "Asset",
            entityId: id,
            newValues: { status }
          }
        });
      }

      return updated;
    });

    return { success: true, message: `Successfully updated status to ${status} for ${result.count} assets.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update assets status." };
  }
}

export async function bulkUpdateAssetsCondition(assetIds: string[], condition: AssetCondition): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return { success: false, message: "Unauthorized." };

    if (!assetIds || assetIds.length === 0) return { success: false, message: "No assets selected." };

    const result = await db.$transaction(async (tx) => {
      const updated = await tx.asset.updateMany({
        where: { id: { in: assetIds } },
        data: { condition }
      });

      for (const id of assetIds) {
        await tx.activityLog.create({
          data: {
            userId,
            action: "BULK_UPDATE_CONDITION",
            entityType: "Asset",
            entityId: id,
            newValues: { condition }
          }
        });
      }

      return updated;
    });

    return { success: true, message: `Successfully updated condition to ${condition} for ${result.count} assets.`, data: result };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update assets condition." };
  }
}

// ----------------------------------------------------
// CATEGORY DETAILS API
// ----------------------------------------------------

export async function getCategoryDetails(categoryId: string) {
  try {
    const category = await db.assetCategory.findUnique({
      where: { id: categoryId },
      include: {
        assets: {
          where: { deletedAt: null },
          include: {
            department: { select: { name: true } },
            currentHolder: { select: { name: true } }
          }
        }
      }
    });

    if (!category || category.deletedAt !== null) return null;

    // Calculations
    const assetCount = category.assets.length;
    const totalValuation = category.assets.reduce((sum, a) => sum + Number(a.acquisitionCost.toString()), 0);
    const underMaintenanceCount = category.assets.filter(a => a.status === AssetStatus.UNDER_MAINTENANCE).length;
    const allocatedCount = category.assets.filter(a => a.status === AssetStatus.ALLOCATED).length;

    return JSON.parse(
      JSON.stringify({
        ...category,
        assetCount,
        totalValuation,
        underMaintenanceCount,
        allocatedCount,
        assets: category.assets.map(serializeAsset)
      })
    );
  } catch (err) {
    console.error(err);
    return null;
  }
}



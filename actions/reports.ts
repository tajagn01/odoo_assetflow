"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role, AssetStatus, AssetCondition, MaintenancePriority } from "@prisma/client";

async function verifyAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

export interface ReportingDataResponse {
  assetStatusDistribution: { status: string; count: number }[];
  categoryDistribution: { categoryName: string; count: number; totalCost: number }[];
  departmentDistribution: { departmentName: string; count: number; totalCost: number }[];
  maintenancePriorityDistribution: { priority: string; count: number }[];
  conditionDistribution: { condition: string; count: number }[];
  generalStats: {
    totalAssets: number;
    totalValuation: number;
    averageAssetCost: number;
    sharedResourcesCount: number;
  };
}

export async function getReportingData(): Promise<ReportingDataResponse | null> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) return null;

    // 1. Asset status distribution
    const statusCounts = await db.asset.groupBy({
      by: ["status"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const statusMap = statusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.id,
    }));

    // Fill missing status types if empty
    const allStatuses = Object.values(AssetStatus);
    const assetStatusDistribution = allStatuses.map((s) => {
      const match = statusMap.find((item) => item.status === s);
      return { status: s, count: match ? match.count : 0 };
    });

    // 2. Category distribution
    const categoryStats = await db.assetCategory.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        assets: {
          where: { deletedAt: null },
          select: { acquisitionCost: true },
        },
      },
    });

    const categoryDistribution = categoryStats.map((cat) => {
      const count = cat.assets.length;
      const totalCost = cat.assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost.toString()), 0);
      return {
        categoryName: cat.name,
        count,
        totalCost,
      };
    });

    // 3. Department distribution
    const deptStats = await db.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        assets: {
          where: { deletedAt: null },
          select: { acquisitionCost: true },
        },
      },
    });

    const departmentDistribution = deptStats.map((dept) => {
      const count = dept.assets.length;
      const totalCost = dept.assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost.toString()), 0);
      return {
        departmentName: dept.name,
        count,
        totalCost,
      };
    });

    // 4. Maintenance priority distribution
    const priorityCounts = await db.maintenanceRequest.groupBy({
      by: ["priority"],
      _count: { id: true },
    });

    const priorityMap = priorityCounts.map((pc) => ({
      priority: pc.priority,
      count: pc._count.id,
    }));

    const allPriorities = Object.values(MaintenancePriority);
    const maintenancePriorityDistribution = allPriorities.map((p) => {
      const match = priorityMap.find((item) => item.priority === p);
      return { priority: p, count: match ? match.count : 0 };
    });

    // 5. Condition distribution
    const conditionCounts = await db.asset.groupBy({
      by: ["condition"],
      where: { deletedAt: null },
      _count: { id: true },
    });

    const conditionMap = conditionCounts.map((cc) => ({
      condition: cc.condition,
      count: cc._count.id,
    }));

    const allConditions = Object.values(AssetCondition);
    const conditionDistribution = allConditions.map((c) => {
      const match = conditionMap.find((item) => item.condition === c);
      return { condition: c, count: match ? match.count : 0 };
    });

    // 6. General inventory aggregate summaries
    const assets = await db.asset.findMany({
      where: { deletedAt: null },
      select: { acquisitionCost: true, isSharedResource: true },
    });

    const totalAssets = assets.length;
    const totalValuation = assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost.toString()), 0);
    const averageAssetCost = totalAssets > 0 ? totalValuation / totalAssets : 0;
    const sharedResourcesCount = assets.filter((a) => a.isSharedResource).length;

    return {
      assetStatusDistribution,
      categoryDistribution,
      departmentDistribution,
      maintenancePriorityDistribution,
      conditionDistribution,
      generalStats: {
        totalAssets,
        totalValuation,
        averageAssetCost,
        sharedResourcesCount,
      },
    };
  } catch (error) {
    console.error("Reports aggregation error:", error);
    return null;
  }
}

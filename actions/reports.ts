"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetStatus, AssetCondition, MaintenancePriority, BookingStatus, AllocationStatus } from "@prisma/client";

async function verifyAuthorized() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD", "EMPLOYEE"].includes(session.user.role)) {
    return null;
  }
  return session;
}

export async function getReportingData(filters?: {
  departmentId?: string;
  categoryId?: string;
  status?: string;
  startDate?: string;
  endDate?: string;
}) {
  try {
    const session = await verifyAuthorized();
    if (!session) return null;

    const role = session.user.role;
    const now = new Date();

    // Enforce Security:
    // ADMIN, ASSET_MANAGER see organization-wide reports.
    // DEPARTMENT_HEAD sees only their own department.
    // EMPLOYEE sees only their own assigned assets/bookings.
    let assetWhere: any = { deletedAt: null };
    let bookingWhere: any = {};
    let maintenanceWhere: any = {};
    let allocationWhere: any = {};

    if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (!deptId) return null;
      assetWhere.departmentId = deptId;
      bookingWhere.asset = { departmentId: deptId };
      maintenanceWhere.asset = { departmentId: deptId };
      allocationWhere.asset = { departmentId: deptId };
    } else if (role === "EMPLOYEE") {
      assetWhere.currentHolderId = session.user.id;
      bookingWhere.userId = session.user.id;
      maintenanceWhere.raisedById = session.user.id;
      allocationWhere.userId = session.user.id;
    }

    // Apply UI Filters if provided:
    if (filters) {
      if (filters.departmentId && role !== "DEPARTMENT_HEAD" && role !== "EMPLOYEE") {
        assetWhere.departmentId = filters.departmentId;
        bookingWhere.asset = { departmentId: filters.departmentId };
        maintenanceWhere.asset = { departmentId: filters.departmentId };
        allocationWhere.asset = { departmentId: filters.departmentId };
      }
      if (filters.categoryId) {
        assetWhere.categoryId = filters.categoryId;
        bookingWhere.asset = { ...bookingWhere.asset, categoryId: filters.categoryId };
        maintenanceWhere.asset = { ...maintenanceWhere.asset, categoryId: filters.categoryId };
        allocationWhere.asset = { ...allocationWhere.asset, categoryId: filters.categoryId };
      }
      if (filters.status) {
        assetWhere.status = filters.status as AssetStatus;
      }
      if (filters.startDate || filters.endDate) {
        const start = filters.startDate ? new Date(filters.startDate) : new Date(0);
        const end = filters.endDate ? new Date(filters.endDate) : new Date();
        assetWhere.acquisitionDate = { gte: start, lte: end };
      }
    }

    // 1. Asset status distribution (Lifecycle)
    const statusCounts = await db.asset.groupBy({
      by: ["status"],
      where: assetWhere,
      _count: { id: true },
    });
    const statusMap = statusCounts.map((sc) => ({
      status: sc.status,
      count: sc._count.id,
    }));
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
          where: assetWhere,
          select: { acquisitionCost: true },
        },
      },
    });
    const categoryDistribution = categoryStats.map((cat) => {
      const count = cat.assets.length;
      const totalCost = cat.assets.reduce((sum, asset) => sum + Number(asset.acquisitionCost.toString()), 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        count,
        totalCost,
      };
    }).filter(c => c.count > 0);

    // 3. Department distribution (Performance)
    const deptStats = await db.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        assets: {
          where: assetWhere,
          select: { acquisitionCost: true },
        },
      },
    });
    const departmentDistribution = deptStats.map((dept) => {
      const count = dept.assets.length;
      const totalCost = dept.assets.reduce((sum, asset) => sum + Number(dept.assets.length > 0 ? asset.acquisitionCost.toString() : "0"), 0);
      return {
        departmentId: dept.id,
        departmentName: dept.name,
        count,
        totalCost,
      };
    }).filter(d => d.count > 0);

    // 4. Condition distribution
    const conditionCounts = await db.asset.groupBy({
      by: ["condition"],
      where: assetWhere,
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

    // 5. Booking Heatmap
    const bookingStats = await db.resourceBooking.groupBy({
      by: ["assetId"],
      _count: { id: true },
      where: {
        ...bookingWhere,
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING, BookingStatus.COMPLETED] }
      }
    });
    const bookingAssetIds = bookingStats.map(bs => bs.assetId);
    const bookingAssets = await db.asset.findMany({
      where: { id: { in: bookingAssetIds } },
      select: { id: true, name: true, tag: true }
    });
    const bookingHeatmap = bookingStats.map(bs => {
      const asset = bookingAssets.find(a => a.id === bs.assetId);
      return {
        assetName: asset?.name || "Unknown Resource",
        tag: asset?.tag || "N/A",
        count: bs._count.id
      };
    });

    // 6. Maintenance Cost & Frequency Reports
    const maintenanceTickets = await db.maintenanceRequest.findMany({
      where: maintenanceWhere,
      include: { asset: { select: { tag: true, name: true } } }
    });

    const totalMaintenanceCost = maintenanceTickets.reduce((sum, t) => sum + (t.repairCost || 0), 0);
    
    // Group cost by category or asset
    const maintenanceCostReport = maintenanceTickets
      .filter(t => (t.repairCost || 0) > 0)
      .map(t => ({
        assetTag: t.asset.tag,
        assetName: t.asset.name,
        cost: t.repairCost || 0,
        date: t.createdAt.toLocaleDateString(),
      }));

    // Frequency by Asset
    const freqMap: Record<string, { tag: string; name: string; count: number }> = {};
    maintenanceTickets.forEach(t => {
      if (!freqMap[t.assetId]) {
        freqMap[t.assetId] = { tag: t.asset.tag, name: t.asset.name, count: 0 };
      }
      freqMap[t.assetId].count += 1;
    });
    const maintenanceFrequencyReport = Object.values(freqMap).sort((a, b) => b.count - a.count);

    // 7. Overdue Assets
    const overdueAllocations = await db.allocation.findMany({
      where: {
        ...allocationWhere,
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: { lt: now }
      },
      include: {
        asset: { select: { tag: true, name: true } },
        user: { select: { name: true, email: true } }
      }
    });

    const overdueAssetsReport = overdueAllocations.map(al => ({
      allocationId: al.id,
      tag: al.asset.tag,
      name: al.asset.name,
      holder: al.user.name,
      overdueSince: al.expectedReturnDate ? al.expectedReturnDate.toLocaleDateString() : "N/A",
    }));

    // 8. Retirement Forecast & Warranty Expirations
    const allActiveAssets = await db.asset.findMany({
      where: assetWhere,
      select: { tag: true, name: true, acquisitionDate: true, acquisitionCost: true, condition: true }
    });

    // Retirement Forecast: Assets with age > 5 years or in POOR condition
    const retirementForecast = allActiveAssets.map(a => {
      const ageYears = (now.getTime() - a.acquisitionDate.getTime()) / (1000 * 60 * 60 * 24 * 365);
      const isRetiring = ageYears > 5 || a.condition === AssetCondition.POOR;
      return {
        tag: a.tag,
        name: a.name,
        ageYears: Math.round(ageYears * 10) / 10,
        condition: a.condition,
        forecastAction: isRetiring ? "RETIRE NOW" : "RETAIN",
      };
    }).filter(f => f.forecastAction === "RETIRE NOW");

    // Warranty Expiry Report: Mock warranty length = 2 years from acquisitionDate
    const warrantyExpiryReport = allActiveAssets.map(a => {
      const expiry = new Date(a.acquisitionDate);
      expiry.setFullYear(expiry.getFullYear() + 2); // 2 Year warranty
      const isExpired = expiry < now;
      const expiresSoon = !isExpired && (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24) < 365;

      return {
        tag: a.tag,
        name: a.name,
        expiryDate: expiry.toLocaleDateString(),
        status: isExpired ? "EXPIRED" : expiresSoon ? "EXPIRING SOON" : "ACTIVE",
      };
    }).filter(w => w.status !== "ACTIVE");

    // 9. Booking trends & General Inventory Totals
    const totalAssets = allActiveAssets.length;
    const totalValuation = allActiveAssets.reduce((sum, asset) => sum + Number(asset.acquisitionCost.toString()), 0);
    const averageAssetCost = totalAssets > 0 ? totalValuation / totalAssets : 0;

    return JSON.parse(
      JSON.stringify({
        assetStatusDistribution,
        categoryDistribution,
        departmentDistribution,
        conditionDistribution,
        bookingHeatmap,
        maintenanceCostReport,
        maintenanceFrequencyReport,
        overdueAssetsReport,
        retirementForecast,
        warrantyExpiryReport,
        generalStats: {
          totalAssets,
          totalValuation,
          averageAssetCost,
          totalMaintenanceCost,
        }
      })
    );
  } catch (error) {
    console.error("Reports aggregation error:", error);
    return null;
  }
}

// Smart Reminder Trigger Engine: Automatically scan and generate alerts
export async function triggerSmartReminders(): Promise<{ success: boolean; count: number }> {
  try {
    const now = new Date();
    const oneDayFromNow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const oneHourFromNow = new Date(now.getTime() + 60 * 60 * 1000);
    let reminderCount = 0;

    // A. Scan upcoming bookings for 24h & 1h alerts
    const bookings = await db.resourceBooking.findMany({
      where: {
        status: BookingStatus.UPCOMING,
        startTime: { gte: now, lte: oneDayFromNow }
      },
      include: { asset: true, user: true }
    });

    for (const b of bookings) {
      const diffMs = b.startTime.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      // Check if we already created a booking reminder in notifications
      const existing = await db.notification.findFirst({
        where: {
          userId: b.userId,
          type: "BOOKING",
          message: { contains: b.id }
        }
      });

      if (!existing) {
        let reminderMsg = "";
        if (diffHours <= 1) {
          reminderMsg = `Your booking for [${b.asset.tag}] ${b.asset.name} starts in less than 1 hour. Booking Ref: ${b.id}`;
        } else if (diffHours <= 24) {
          reminderMsg = `Reminder: Your booking for [${b.asset.tag}] ${b.asset.name} is scheduled for tomorrow at ${b.startTime.toLocaleTimeString()}. Booking Ref: ${b.id}`;
        }

        if (reminderMsg) {
          await db.notification.create({
            data: {
              userId: b.userId,
              title: "Upcoming Booking Reminder",
              message: reminderMsg,
              type: "BOOKING",
            }
          });
          reminderCount++;
        }
      }
    }

    // B. Scan active allocations overdue return reminders
    const allocations = await db.allocation.findMany({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: { gte: now, lte: oneDayFromNow }
      },
      include: { asset: true, user: true }
    });

    for (const al of allocations) {
      if (!al.expectedReturnDate) continue;
      const diffMs = al.expectedReturnDate.getTime() - now.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      const existing = await db.notification.findFirst({
        where: {
          userId: al.userId,
          type: "ALLOCATION",
          message: { contains: al.id }
        }
      });

      if (!existing) {
        let reminderMsg = "";
        if (diffHours <= 1) {
          reminderMsg = `URGENT: Your allocation for [${al.asset.tag}] ${al.asset.name} is due for return in 1 hour. Ref: ${al.id}`;
        } else if (diffHours <= 24) {
          reminderMsg = `Reminder: You have an asset [${al.asset.tag}] ${al.asset.name} due for return tomorrow. Ref: ${al.id}`;
        }

        if (reminderMsg) {
          await db.notification.create({
            data: {
              userId: al.userId,
              title: "Return Due Reminder",
              message: reminderMsg,
              type: "ALLOCATION",
            }
          });
          reminderCount++;
        }
      }
    }

    return { success: true, count: reminderCount };
  } catch (err) {
    console.error("Smart Reminder Engine failed:", err);
    return { success: false, count: 0 };
  }
}

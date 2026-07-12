"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { AssetStatus, BookingStatus, AllocationStatus, Role, MaintenanceStatus } from "@prisma/client";

export async function getDashboardMetrics() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    const now = new Date();
    const role = session.user.role;
    const departmentId = (session.user as any).departmentId || null;

    // We will build filters dynamically based on roles
    let assetWhere: any = { deletedAt: null };
    let bookingWhere: any = { status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] } };
    let maintenanceWhere: any = {};
    let overdueWhere: any = { status: AllocationStatus.ACTIVE, expectedReturnDate: { lt: now } };
    let activityWhere: any = {};

    if (role === "DEPARTMENT_HEAD") {
      if (!departmentId) {
        return {
          kpis: { assetsAvailable: 0, assetsAllocated: 0, activeBookings: 0, maintenanceToday: 0 },
          overdueReturns: [],
          activities: [],
          pendingMaintenance: [],
          personal: { myAssetsCount: 0, myBookingsCount: 0, myRequestsCount: 0, myAssets: [], myBookings: [] },
          deptStats: { employeesCount: 0, assetsCount: 0 }
        };
      }
      assetWhere.departmentId = departmentId;
      bookingWhere.asset = { departmentId };
      maintenanceWhere.OR = [
        { raisedBy: { departmentId } },
        { asset: { departmentId } }
      ];
      overdueWhere.asset = { departmentId };
      activityWhere.user = { departmentId };
    } else if (role === "EMPLOYEE") {
      assetWhere.currentHolderId = session.user.id;
      bookingWhere.userId = session.user.id;
      maintenanceWhere.raisedById = session.user.id;
      overdueWhere.userId = session.user.id;
      activityWhere.userId = session.user.id;
    }

    // 1. Core KPIs
    const assetsAvailable = await db.asset.count({
      where: { ...assetWhere, status: AssetStatus.AVAILABLE },
    });

    const assetsAllocated = await db.asset.count({
      where: { ...assetWhere, status: AssetStatus.ALLOCATED },
    });

    const activeBookings = await db.resourceBooking.count({
      where: bookingWhere,
    });

    const maintenanceToday = await db.asset.count({
      where: { ...assetWhere, status: AssetStatus.UNDER_MAINTENANCE },
    });

    // 2. Overdue return alerts
    const overdueAllocations = await db.allocation.findMany({
      where: overdueWhere,
      include: {
        asset: { select: { tag: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { expectedReturnDate: "asc" },
      take: 5,
    });

    // 3. Recent activity logs (for audit log timeline feed)
    const recentActivities = await db.activityLog.findMany({
      where: activityWhere,
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    // 4. Pending Maintenance Requests requiring manager approval
    const pendingMaintenance = await db.maintenanceRequest.findMany({
      where: { ...maintenanceWhere, status: MaintenanceStatus.PENDING },
      include: {
        asset: { select: { tag: true, name: true } },
        raisedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 5,
    });

    // 5. Role specific counts and lists
    const myAssets = await db.asset.findMany({
      where: { currentHolderId: session.user.id, deletedAt: null },
      select: { id: true, tag: true, name: true, location: true, condition: true },
    });

    const myAssetsCount = myAssets.length;

    const myBookings = await db.resourceBooking.findMany({
      where: {
        userId: session.user.id,
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
      },
      include: {
        asset: { select: { name: true, tag: true } },
      },
      orderBy: { startTime: "asc" },
      take: 5,
    });

    const myBookingsCount = await db.resourceBooking.count({
      where: {
        userId: session.user.id,
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
      },
    });

    const myRequestsCount = await db.maintenanceRequest.count({
      where: { raisedById: session.user.id },
    });

    let deptEmployeesCount = 0;
    let deptAssetsCount = 0;
    if (role === "DEPARTMENT_HEAD" && departmentId) {
      deptEmployeesCount = await db.user.count({ where: { departmentId } });
      deptAssetsCount = await db.asset.count({ where: { departmentId, deletedAt: null } });
    }

    return JSON.parse(
      JSON.stringify({
        kpis: {
          assetsAvailable,
          assetsAllocated,
          activeBookings,
          maintenanceToday,
        },
        overdueReturns: overdueAllocations,
        activities: recentActivities,
        pendingMaintenance,
        personal: {
          myAssetsCount,
          myBookingsCount,
          myRequestsCount,
          myAssets,
          myBookings,
        },
        deptStats: {
          employeesCount: deptEmployeesCount,
          assetsCount: deptAssetsCount,
        }
      })
    );
  } catch (error) {
    console.error("Failed to load dashboard metrics:", error);
    return null;
  }
}

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

    // 1. Core KPIs
    const assetsAvailable = await db.asset.count({
      where: { status: AssetStatus.AVAILABLE, deletedAt: null },
    });

    const assetsAllocated = await db.asset.count({
      where: { status: AssetStatus.ALLOCATED, deletedAt: null },
    });

    const activeBookings = await db.resourceBooking.count({
      where: { status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] } },
    });

    const maintenanceToday = await db.asset.count({
      where: { status: AssetStatus.UNDER_MAINTENANCE, deletedAt: null },
    });

    // 2. Overdue return alerts
    const overdueAllocations = await db.allocation.findMany({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: { lt: now },
      },
      include: {
        asset: { select: { tag: true, name: true } },
        user: { select: { name: true, email: true } },
      },
      orderBy: { expectedReturnDate: "asc" },
      take: 5,
    });

    // 3. Recent activity logs (for audit log timeline feed)
    const recentActivities = await db.activityLog.findMany({
      include: {
        user: { select: { name: true, role: true } },
      },
      orderBy: { timestamp: "desc" },
      take: 10,
    });

    // 4. Pending Maintenance Requests requiring manager approval
    const pendingMaintenance = await db.maintenanceRequest.findMany({
      where: { status: MaintenanceStatus.PENDING },
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

    return {
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
    };
  } catch (error) {
    console.error("Failed to load dashboard metrics:", error);
    return null;
  }
}

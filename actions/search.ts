"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

export interface SearchResult {
  id: string;
  type: "ASSET" | "EMPLOYEE" | "DEPARTMENT" | "BOOKING" | "MAINTENANCE" | "AUDIT" | "NOTIFICATION" | "LOG" | "ROUTE";
  title: string;
  subtitle: string;
  href: string;
}

/**
 * Centrally searches across all database entities for unified indexing
 */
export async function searchEnterprise(query: string): Promise<SearchResult[]> {
  try {
    const session = await auth();
    if (!session) return [];

    const trimmed = query.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) return [];

    const results: SearchResult[] = [];
    const role = session.user.role;

    // 1. ASSETS (by name, tag, serial, location)
    // Employees only see their allocated assets. Department heads see department assets. Admins/Managers see all.
    const assetWhere: any = { deletedAt: null };
    if (role === "DEPARTMENT_HEAD" && session.user.departmentId) {
      assetWhere.departmentId = session.user.departmentId;
    } else if (role === "EMPLOYEE") {
      assetWhere.currentHolderId = session.user.id;
    }

    const assets = await db.asset.findMany({
      where: {
        ...assetWhere,
        OR: [
          { name: { contains: trimmed, mode: "insensitive" } },
          { tag: { contains: trimmed, mode: "insensitive" } },
          { serialNumber: { contains: trimmed, mode: "insensitive" } },
          { location: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 5,
    });

    assets.forEach((a) => {
      results.push({
        id: a.id,
        type: "ASSET",
        title: a.name,
        subtitle: `Tag: ${a.tag} · Loc: ${a.location} · Status: ${a.status}`,
        href: `/dashboard/assets/${a.id}`,
      });
    });

    // 2. EMPLOYEES (Admins/Managers and Dept Heads can search all. Employees can only search department members)
    const userWhere: any = {};
    if (role === "EMPLOYEE") {
      // Employees cannot search directory
      userWhere.id = "none";
    } else if (role === "DEPARTMENT_HEAD" && session.user.departmentId) {
      userWhere.departmentId = session.user.departmentId;
    }

    if (userWhere.id !== "none") {
      const users = await db.user.findMany({
        where: {
          ...userWhere,
          OR: [
            { name: { contains: trimmed, mode: "insensitive" } },
            { email: { contains: trimmed, mode: "insensitive" } },
            { phone: { contains: trimmed, mode: "insensitive" } },
            { jobTitle: { contains: trimmed, mode: "insensitive" } },
          ],
        },
        take: 5,
      });

      users.forEach((u) => {
        results.push({
          id: u.id,
          type: "EMPLOYEE",
          title: u.name,
          subtitle: `${u.jobTitle || "Associate"} · ${u.email} · Role: ${u.role}`,
          href: `/dashboard/employees/${u.id}`,
        });
      });
    }

    // 3. DEPARTMENTS (Admins/Managers and Dept Heads can search)
    if (["ADMIN", "ASSET_MANAGER", "DEPARTMENT_HEAD"].includes(role)) {
      const depts = await db.department.findMany({
        where: {
          deletedAt: null,
          name: { contains: trimmed, mode: "insensitive" },
        },
        take: 3,
      });

      depts.forEach((d) => {
        results.push({
          id: d.id,
          type: "DEPARTMENT",
          title: d.name,
          subtitle: `Department Profile Division`,
          href: `/dashboard/departments/${d.id}`,
        });
      });
    }

    // 4. BOOKINGS (Search active bookings by asset name)
    const bookingWhere: any = {};
    if (role === "EMPLOYEE") {
      bookingWhere.userId = session.user.id;
    }

    const bookings = await db.resourceBooking.findMany({
      where: {
        ...bookingWhere,
        asset: { name: { contains: trimmed, mode: "insensitive" } },
      },
      include: { asset: true },
      take: 3,
    });

    bookings.forEach((b) => {
      results.push({
        id: b.id,
        type: "BOOKING",
        title: `Booking: ${b.asset.name}`,
        subtitle: `Schedule: ${new Date(b.startTime).toLocaleDateString()} — Status: ${b.status}`,
        href: `/dashboard/bookings`,
      });
    });

    // 5. MAINTENANCE REQUESTS (Search by issue description or asset name)
    const maintWhere: any = {};
    if (role === "EMPLOYEE") {
      maintWhere.raisedById = session.user.id;
    }

    const maints = await db.maintenanceRequest.findMany({
      where: {
        ...maintWhere,
        OR: [
          { issueDescription: { contains: trimmed, mode: "insensitive" } },
          { asset: { name: { contains: trimmed, mode: "insensitive" } } },
        ],
      },
      include: { asset: true },
      take: 3,
    });

    maints.forEach((m) => {
      results.push({
        id: m.id,
        type: "MAINTENANCE",
        title: `Repair: ${m.asset.name}`,
        subtitle: `Priority: ${m.priority} · Issue: "${m.issueDescription.slice(0, 30)}..."`,
        href: `/dashboard/maintenance`,
      });
    });

    // 6. AUDIT CYCLES (Admins and managers can search)
    if (["ADMIN", "ASSET_MANAGER"].includes(role)) {
      const audits = await db.auditCycle.findMany({
        where: {
          name: { contains: trimmed, mode: "insensitive" },
        },
        take: 3,
      });

      audits.forEach((a) => {
        results.push({
          id: a.id,
          type: "AUDIT",
          title: `Audit: ${a.name}`,
          subtitle: `Dates: ${new Date(a.startDate).toLocaleDateString()} — Status: ${a.status}`,
          href: `/dashboard/audits`,
        });
      });
    }

    // 7. NOTIFICATIONS (Search alerts by title or message)
    const notifications = await db.notification.findMany({
      where: {
        userId: session.user.id,
        OR: [
          { title: { contains: trimmed, mode: "insensitive" } },
          { message: { contains: trimmed, mode: "insensitive" } },
        ],
      },
      take: 3,
    });

    notifications.forEach((n) => {
      results.push({
        id: n.id,
        type: "NOTIFICATION",
        title: n.title,
        subtitle: n.message,
        href: `/dashboard/notifications`,
      });
    });

    return results;
  } catch (error) {
    console.error("Centralized Search failure:", error);
    return [];
  }
}

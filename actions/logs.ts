"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { Role } from "@prisma/client";

async function verifyAdmin(): Promise<string | null> {
  const session = await auth();
  if (!session || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session.user.id;
}

export async function getActivityLogs(filters?: {
  search?: string;
  action?: string;
}) {
  try {
    const session = await auth();
    if (!session) return [];

    const role = session.user.role;
    const whereClause: any = {};

    if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (!deptId) return [];
      whereClause.user = { departmentId: deptId };
    } else if (role === "EMPLOYEE") {
      whereClause.userId = session.user.id;
    }

    if (filters?.action) {
      whereClause.action = filters.action;
    }

    if (filters?.search) {
      whereClause.OR = [
        { action: { contains: filters.search, mode: "insensitive" } },
        { entityType: { contains: filters.search, mode: "insensitive" } },
        { entityId: { contains: filters.search, mode: "insensitive" } },
        {
          user: {
            name: { contains: filters.search, mode: "insensitive" },
          },
        },
      ];
    }

    return await db.activityLog.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            departmentId: true,
          },
        },
      },
      orderBy: { timestamp: "desc" },
    });
  } catch (error) {
    console.error("Failed to fetch activity logs:", error);
    return [];
  }
}

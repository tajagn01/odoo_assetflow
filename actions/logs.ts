"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";

async function verifyAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
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
    const adminId = await verifyAdmin();
    if (!adminId) return [];

    const whereClause: any = {};

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

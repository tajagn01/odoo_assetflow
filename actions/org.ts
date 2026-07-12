"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Role } from "@prisma/client";
import { ActionResponse } from "./auth";

// Reusable Admin checker
async function verifyAdmin(): Promise<string | null> {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== Role.ADMIN) {
    return null;
  }
  return session.user.id;
}

// ----------------------------------------------------
// DEPARTMENT ACTIONS
// ----------------------------------------------------

export async function getDepartments() {
  try {
    return await db.department.findMany({
      where: { deletedAt: null },
      select: {
        id: true,
        name: true,
        parentId: true,
        managerId: true,
        status: true,
        parent: {
          select: { id: true, name: true },
        },
        manager: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch departments:", error);
    return [];
  }
}

export async function createDepartment(data: {
  name: string;
  parentId?: string | null;
  managerId?: string | null;
}): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    if (!data.name.trim()) {
      return { success: false, message: "Department name is required." };
    }

    const dept = await db.department.create({
      data: {
        name: data.name.trim(),
        parentId: data.parentId || null,
        managerId: data.managerId || null,
        status: "ACTIVE",
      },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "CREATE_DEPARTMENT",
        entityType: "Department",
        entityId: dept.id,
        newValues: { name: dept.name, parentId: dept.parentId },
      },
    });

    return { success: true, message: "Department created successfully.", data: dept };
  } catch (error) {
    console.error("Failed to create department:", error);
    return { success: false, message: "Failed to create department." };
  }
}

export async function updateDepartment(
  id: string,
  data: {
    name: string;
    parentId?: string | null;
    managerId?: string | null;
    status: string;
  }
): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    const current = await db.department.findUnique({ where: { id } });
    if (!current) {
      return { success: false, message: "Department not found." };
    }

    // Prevent circular department hierarchy
    if (data.parentId === id) {
      return { success: false, message: "A department cannot be its own parent." };
    }

    const dept = await db.department.update({
      where: { id },
      data: {
        name: data.name.trim(),
        parentId: data.parentId || null,
        managerId: data.managerId || null,
        status: data.status,
      },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "UPDATE_DEPARTMENT",
        entityType: "Department",
        entityId: dept.id,
        previousValues: current,
        newValues: dept,
      },
    });

    return { success: true, message: "Department updated successfully.", data: dept };
  } catch (error) {
    console.error("Failed to update department:", error);
    return { success: false, message: "Failed to update department." };
  }
}

export async function deleteDepartment(id: string): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    // Check if department has linked users or assets
    const linkedUsersCount = await db.user.count({ where: { departmentId: id } });
    const linkedAssetsCount = await db.asset.count({ where: { departmentId: id } });

    if (linkedUsersCount > 0 || linkedAssetsCount > 0) {
      return {
        success: false,
        message: "Cannot delete department. There are active users or assets assigned to it.",
      };
    }

    const dept = await db.department.update({
      where: { id },
      data: { deletedAt: new Date(), status: "INACTIVE" },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "DELETE_DEPARTMENT",
        entityType: "Department",
        entityId: id,
      },
    });

    return { success: true, message: "Department deactivated successfully.", data: dept };
  } catch (error) {
    console.error("Failed to delete department:", error);
    return { success: false, message: "Failed to deactivate department." };
  }
}

// ----------------------------------------------------
// ASSET CATEGORY ACTIONS
// ----------------------------------------------------

export async function getCategories() {
  try {
    return await db.assetCategory.findMany({
      where: { deletedAt: null },
      include: {
        _count: {
          select: { assets: { where: { deletedAt: null } } },
        },
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch categories:", error);
    return [];
  }
}

export async function createCategory(data: {
  name: string;
  description?: string;
  customFields?: Record<string, any>;
}): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    if (!data.name.trim()) {
      return { success: false, message: "Category name is required." };
    }

    // Check if unique
    const existing = await db.assetCategory.findUnique({
      where: { name: data.name.trim() },
    });

    if (existing && existing.deletedAt === null) {
      return { success: false, message: "A category with this name already exists." };
    }

    const cat = await db.assetCategory.upsert({
      where: { name: data.name.trim() },
      update: {
        description: data.description || null,
        customFields: data.customFields || {},
        deletedAt: null, // restore deleted category
      },
      create: {
        name: data.name.trim(),
        description: data.description || null,
        customFields: data.customFields || {},
      },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "CREATE_CATEGORY",
        entityType: "AssetCategory",
        entityId: cat.id,
        newValues: cat,
      },
    });

    return { success: true, message: "Category configured successfully.", data: cat };
  } catch (error) {
    console.error("Failed to create category:", error);
    return { success: false, message: "Failed to save category." };
  }
}

export async function deleteCategory(id: string): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    // Business rule: Cannot delete category with linked assets.
    const linkedAssetsCount = await db.asset.count({
      where: { categoryId: id, deletedAt: null },
    });

    if (linkedAssetsCount > 0) {
      return {
        success: false,
        message: `Cannot delete category. There are ${linkedAssetsCount} active assets linked to it.`,
      };
    }

    const cat = await db.assetCategory.update({
      where: { id },
      data: { deletedAt: new Date() },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "DELETE_CATEGORY",
        entityType: "AssetCategory",
        entityId: id,
      },
    });

    return { success: true, message: "Category deleted successfully.", data: cat };
  } catch (error) {
    console.error("Failed to delete category:", error);
    return { success: false, message: "Failed to delete category." };
  }
}

// ----------------------------------------------------
// EMPLOYEE DIRECTORY ACTIONS
// ----------------------------------------------------

export async function getEmployees() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return [];

    const role = session.user.role;
    if (role === "EMPLOYEE") {
      return []; // Block Employees
    }

    const whereClause: any = {};
    if (role === "DEPARTMENT_HEAD") {
      const deptId = (session.user as any).departmentId;
      if (!deptId) return [];
      whereClause.departmentId = deptId;
    }

    return await db.user.findMany({
      where: whereClause,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        departmentId: true,
        department: {
          select: {
            id: true,
            name: true,
          },
        },
        createdAt: true,
      },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch employees:", error);
    return [];
  }
}

export async function updateEmployee(
  id: string,
  data: {
    role: Role;
    status: string;
    departmentId?: string | null;
  }
): Promise<ActionResponse> {
  try {
    const adminId = await verifyAdmin();
    if (!adminId) {
      return { success: false, message: "Unauthorized. Admin privileges required." };
    }

    const current = await db.user.findUnique({
      where: { id },
      select: { id: true, name: true, role: true, status: true, departmentId: true },
    });

    if (!current) {
      return { success: false, message: "Employee not found." };
    }

    // If deactivating, ensure we're not deactivating ourselves
    if (data.status === "INACTIVE" && id === adminId) {
      return { success: false, message: "You cannot deactivate your own admin account." };
    }

    const updated = await db.user.update({
      where: { id },
      data: {
        role: data.role,
        status: data.status,
        departmentId: data.departmentId || null,
      },
    });

    await db.activityLog.create({
      data: {
        userId: adminId,
        action: "UPDATE_EMPLOYEE",
        entityType: "User",
        entityId: id,
        previousValues: current,
        newValues: { role: updated.role, status: updated.status, departmentId: updated.departmentId },
      },
    });

    return { success: true, message: "Employee updated successfully.", data: updated };
  } catch (error) {
    console.error("Failed to update employee:", error);
    return { success: false, message: "Failed to update employee." };
  }
}

// Fetch full details of an individual employee for directory profiling
export async function getEmployeeDetails(employeeId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    // Block normal Employees from accessing other profile details
    if (session.user.role === "EMPLOYEE" && session.user.id !== employeeId) {
      return null;
    }

    const employee = await db.user.findUnique({
      where: { id: employeeId },
      include: {
        department: {
          include: {
            manager: { select: { id: true, name: true, email: true } },
          },
        },
        heldAssets: {
          where: { deletedAt: null },
          include: { category: true },
        },
        bookings: {
          include: { asset: true },
          orderBy: { startTime: "desc" },
        },
        maintenanceReqs: {
          include: { asset: true },
          orderBy: { createdAt: "desc" },
        },
        auditedCycles: {
          include: { auditCycle: true },
        },
        activityLogs: {
          take: 20,
          orderBy: { timestamp: "desc" },
        },
      },
    });

    if (!employee) return null;

    // Format fields (cost, dates) for serializability
    const formattedAssets = employee.heldAssets.map((asset) => ({
      ...asset,
      acquisitionCost: Number(asset.acquisitionCost.toString()),
    }));

    return JSON.parse(
      JSON.stringify({
        ...employee,
        heldAssets: formattedAssets,
      })
    );
  } catch (error) {
    console.error("Failed to fetch employee details:", error);
    return null;
  }
}

// Fetch detailed profile for an individual department
export async function getDepartmentDetails(departmentId: string) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) return null;

    // Fetch department overview
    const dept = await db.department.findUnique({
      where: { id: departmentId },
      include: {
        parent: { select: { id: true, name: true } },
        manager: { select: { id: true, name: true, email: true } },
        subDepartments: { where: { deletedAt: null } },
        users: {
          where: { status: "ACTIVE" },
          select: { id: true, name: true, email: true, role: true, status: true },
        },
        assets: {
          where: { deletedAt: null },
          include: { category: true, currentHolder: { select: { name: true } } },
        },
      },
    });

    if (!dept || dept.deletedAt !== null) return null;

    const userIds = dept.users.map((u) => u.id);
    const assetIds = dept.assets.map((a) => a.id);

    // Fetch Bookings for department assets
    const bookings = await db.resourceBooking.findMany({
      where: { assetId: { in: assetIds } },
      include: {
        user: { select: { name: true } },
        asset: { select: { name: true, tag: true } },
      },
      orderBy: { startTime: "desc" },
    });

    // Fetch Maintenance Requests raised by department users or for department assets
    const maintenanceReqs = await db.maintenanceRequest.findMany({
      where: {
        OR: [
          { raisedById: { in: userIds } },
          { assetId: { in: assetIds } },
        ],
      },
      include: {
        raisedBy: { select: { name: true } },
        asset: { select: { name: true, tag: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    // Fetch Activity Logs of department members
    const activityLogs = await db.activityLog.findMany({
      where: { userId: { in: userIds } },
      include: { user: { select: { name: true } } },
      take: 20,
      orderBy: { timestamp: "desc" },
    });

    // Format costs for serialization safety
    const formattedAssets = dept.assets.map((asset) => ({
      ...asset,
      acquisitionCost: Number(asset.acquisitionCost.toString()),
    }));

    return JSON.parse(
      JSON.stringify({
        id: dept.id,
        name: dept.name,
        status: dept.status,
        createdAt: dept.createdAt,
        parent: dept.parent,
        manager: dept.manager,
        subDepartments: dept.subDepartments,
        users: dept.users,
        assets: formattedAssets,
        bookings,
        maintenanceReqs,
        activityLogs,
      })
    );
  } catch (error) {
    console.error("Failed to fetch department details:", error);
    return null;
  }
}



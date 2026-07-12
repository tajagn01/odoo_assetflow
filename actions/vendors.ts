"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { ActionResponse } from "./auth";
import { z } from "zod";

const vendorSchema = z.object({
  companyName: z.string().min(2, "Company Name must be at least 2 characters long."),
  contactPerson: z.string().min(2, "Contact Person must be at least 2 characters long."),
  email: z.string().email("Invalid email address."),
  phone: z.string().min(6, "Phone number must be at least 6 digits long."),
  gstNumber: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  address: z.string().optional().or(z.literal("")),
  notes: z.string().optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});

// Reusable authorization checker
async function verifyAuthorized(): Promise<string | null> {
  const session = await auth();
  if (!session || !["ADMIN", "ASSET_MANAGER"].includes(session.user.role)) {
    return null;
  }
  return session.user.id;
}

export async function getVendors(filters?: {
  search?: string;
  status?: string;
}) {
  try {
    const session = await auth();
    if (!session) return [];

    const whereClause: any = { deletedAt: null };

    if (filters?.status) {
      whereClause.status = filters.status;
    }

    if (filters?.search) {
      whereClause.OR = [
        { companyName: { contains: filters.search, mode: "insensitive" } },
        { contactPerson: { contains: filters.search, mode: "insensitive" } },
        { email: { contains: filters.search, mode: "insensitive" } },
        { phone: { contains: filters.search, mode: "insensitive" } },
      ];
    }

    return await db.vendor.findMany({
      where: whereClause,
      include: {
        _count: {
          select: { assets: { where: { deletedAt: null } } },
        },
      },
      orderBy: { companyName: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch vendors:", error);
    return [];
  }
}

export async function getVendorDetails(vendorId: string) {
  try {
    const session = await auth();
    if (!session) return null;

    const vendor = await db.vendor.findUnique({
      where: { id: vendorId },
      include: {
        assets: {
          where: { deletedAt: null },
          include: { category: true, department: true },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!vendor || vendor.deletedAt !== null) return null;

    // Serialize Decimal costs for safety
    const formattedAssets = vendor.assets.map((a) => ({
      ...a,
      acquisitionCost: Number(a.acquisitionCost.toString()),
    }));

    return JSON.parse(
      JSON.stringify({
        ...vendor,
        assets: formattedAssets,
      })
    );
  } catch (error) {
    console.error("Failed to fetch vendor details:", error);
    return null;
  }
}

export async function createVendor(rawInput: unknown): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const parsed = vendorSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (value) fieldErrors[key] = value;
      }
      return {
        success: false,
        message: "Validation failed.",
        errors: fieldErrors,
      };
    }

    const data = parsed.data;
    const normalizedName = data.companyName.trim();

    // Check duplicate
    const existing = await db.vendor.findFirst({
      where: {
        companyName: { equals: normalizedName, mode: "insensitive" },
        deletedAt: null,
      },
    });

    if (existing) {
      return {
        success: false,
        message: "A vendor with this company name already exists.",
        errors: { companyName: ["Vendor name must be unique."] },
      };
    }

    const vendor = await db.vendor.create({
      data: {
        companyName: normalizedName,
        contactPerson: data.contactPerson.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        gstNumber: data.gstNumber?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status,
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "CREATE_VENDOR",
        entityType: "Vendor",
        entityId: vendor.id,
        newValues: vendor,
      },
    });

    return { success: true, message: "Vendor created successfully.", data: vendor };
  } catch (error) {
    console.error("Failed to create vendor:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function updateVendor(vendorId: string, rawInput: unknown): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    const parsed = vendorSchema.safeParse(rawInput);
    if (!parsed.success) {
      const fieldErrors: Record<string, string[]> = {};
      for (const [key, value] of Object.entries(parsed.error.flatten().fieldErrors)) {
        if (value) fieldErrors[key] = value;
      }
      return {
        success: false,
        message: "Validation failed.",
        errors: fieldErrors,
      };
    }

    const current = await db.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!current || current.deletedAt !== null) {
      return { success: false, message: "Vendor not found." };
    }

    const data = parsed.data;
    const normalizedName = data.companyName.trim();

    // Check duplicate excluding itself
    const existing = await db.vendor.findFirst({
      where: {
        companyName: { equals: normalizedName, mode: "insensitive" },
        id: { not: vendorId },
        deletedAt: null,
      },
    });

    if (existing) {
      return {
        success: false,
        message: "A vendor with this company name already exists.",
        errors: { companyName: ["Vendor name must be unique."] },
      };
    }

    const updated = await db.vendor.update({
      where: { id: vendorId },
      data: {
        companyName: normalizedName,
        contactPerson: data.contactPerson.trim(),
        email: data.email.toLowerCase().trim(),
        phone: data.phone.trim(),
        gstNumber: data.gstNumber?.trim() || null,
        website: data.website?.trim() || null,
        address: data.address?.trim() || null,
        notes: data.notes?.trim() || null,
        status: data.status,
      },
    });

    // Write Activity Log with Before/After
    await db.activityLog.create({
      data: {
        userId,
        action: "UPDATE_VENDOR",
        entityType: "Vendor",
        entityId: vendorId,
        previousValues: current,
        newValues: updated,
      },
    });

    return { success: true, message: "Vendor updated successfully.", data: updated };
  } catch (error) {
    console.error("Failed to update vendor:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

export async function deleteVendor(vendorId: string): Promise<ActionResponse> {
  try {
    const userId = await verifyAuthorized();
    if (!userId) {
      return { success: false, message: "Unauthorized. Admin or Manager role required." };
    }

    // Check business constraint: Prevent deleting Vendors linked to active assets
    const activeAssetsCount = await db.asset.count({
      where: {
        vendorId,
        deletedAt: null,
      },
    });

    if (activeAssetsCount > 0) {
      return {
        success: false,
        message: `Cannot delete vendor. There are ${activeAssetsCount} active asset(s) linked to this vendor in the system.`,
      };
    }

    const current = await db.vendor.findUnique({
      where: { id: vendorId },
    });

    if (!current || current.deletedAt !== null) {
      return { success: false, message: "Vendor not found." };
    }

    // Soft Delete
    const deletedVendor = await db.vendor.update({
      where: { id: vendorId },
      data: {
        deletedAt: new Date(),
        status: "INACTIVE",
      },
    });

    // Write Activity Log
    await db.activityLog.create({
      data: {
        userId,
        action: "DELETE_VENDOR",
        entityType: "Vendor",
        entityId: vendorId,
        previousValues: { id: current.id, name: current.companyName },
      },
    });

    return { success: true, message: "Vendor removed successfully.", data: deletedVendor };
  } catch (error) {
    console.error("Failed to delete vendor:", error);
    return { success: false, message: "An unexpected error occurred." };
  }
}

"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import { ActionResponse } from "./auth";
import { revalidatePath } from "next/cache";

// Fetch full profile data for the current authenticated user
export async function getProfileData() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return null;
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
      include: {
        department: true,
        allocations: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { asset: true },
        },
        bookings: {
          take: 5,
          orderBy: { startTime: "desc" },
          include: { asset: true },
        },
        maintenanceReqs: {
          take: 5,
          orderBy: { createdAt: "desc" },
          include: { asset: true },
        },
      },
    });

    if (!user) return null;

    // Convert decimal cost in allocations to number for client safety
    const formattedAllocations = user.allocations.map((alloc) => ({
      ...alloc,
      asset: {
        ...alloc.asset,
        acquisitionCost: Number(alloc.asset.acquisitionCost.toString()),
      },
    }));

    const formattedBookings = user.bookings.map((booking) => ({
      ...booking,
      asset: {
        ...booking.asset,
        acquisitionCost: Number(booking.asset.acquisitionCost.toString()),
      },
    }));

    const formattedMaintenance = user.maintenanceReqs.map((req) => ({
      ...req,
      asset: {
        ...req.asset,
        acquisitionCost: Number(req.asset.acquisitionCost.toString()),
      },
    }));

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      status: user.status,
      phone: user.phone || "",
      bio: user.bio || "",
      location: user.location || "",
      timezone: user.timezone || "UTC",
      language: user.language || "en",
      avatarUrl: user.avatarUrl || "",
      jobTitle: user.jobTitle || "Associate",
      employeeId: user.employeeId || `AF-EMP-${user.id.slice(0, 6).toUpperCase()}`,
      appearanceTheme: user.appearanceTheme || "light",
      emailNotificationsEnabled: user.emailNotificationsEnabled,
      joinedAt: user.createdAt,
      department: user.department ? { id: user.department.id, name: user.department.name } : null,
      allocations: formattedAllocations,
      bookings: formattedBookings,
      maintenance: formattedMaintenance,
    };
  } catch (error) {
    console.error("Fetch profile error:", error);
    return null;
  }
}

// Update profile parameters
export async function updateProfileData(input: {
  name: string;
  phone: string;
  bio: string;
  location: string;
  timezone: string;
  language: string;
  avatarUrl?: string;
  appearanceTheme?: string;
  emailNotificationsEnabled?: boolean;
}): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    if (!input.name || input.name.trim().length === 0) {
      return { success: false, message: "Full Name is required." };
    }

    await db.user.update({
      where: { id: session.user.id },
      data: {
        name: input.name.trim(),
        phone: input.phone.trim() || null,
        bio: input.bio.trim() || null,
        location: input.location.trim() || null,
        timezone: input.timezone || "UTC",
        language: input.language || "en",
        avatarUrl: input.avatarUrl || null,
        appearanceTheme: input.appearanceTheme || "light",
        emailNotificationsEnabled: input.emailNotificationsEnabled !== undefined ? input.emailNotificationsEnabled : true,
      },
    });

    // Write activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_PROFILE",
        entityType: "User",
        entityId: session.user.id,
      },
    });

    return { success: true, message: "Profile configurations saved successfully." };
  } catch (error: any) {
    console.error("Update profile error:", error);
    return { success: false, message: error.message || "Failed to update profile settings." };
  }
}

// Security: Change User Password
export async function updateUserPassword(rawInput: any): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user?.id) {
      return { success: false, message: "Unauthorized. Please log in." };
    }

    const { currentPassword, newPassword, confirmPassword } = rawInput;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return { success: false, message: "All password fields are required." };
    }

    if (newPassword !== confirmPassword) {
      return { success: false, message: "New passwords do not match." };
    }

    if (newPassword.length < 8) {
      return { success: false, message: "Password must be at least 8 characters long." };
    }

    const user = await db.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return { success: false, message: "Account not found." };
    }

    const isMatch = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isMatch) {
      return { success: false, message: "Incorrect current password." };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update
    await db.user.update({
      where: { id: session.user.id },
      data: { passwordHash },
    });

    // Write activity log
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CHANGE_PASSWORD",
        entityType: "User",
        entityId: session.user.id,
      },
    });

    return { success: true, message: "Your login password has been changed successfully." };
  } catch (error: any) {
    console.error("Change password error:", error);
    return { success: false, message: "An error occurred while changing password." };
  }
}

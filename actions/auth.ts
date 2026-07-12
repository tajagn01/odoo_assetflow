"use server";

import { db } from "@/lib/db";
import bcrypt from "bcryptjs";
import { z } from "zod";

const signupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters long."),
  email: z.string().email("Invalid email address."),
  password: z.string().min(8, "Password must be at least 8 characters long.")
    .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
    .regex(/[0-9]/, "Password must contain at least one number.")
    .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
});

export type ActionResponse<T = any> = {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
};

export async function registerUser(rawInput: unknown): Promise<ActionResponse> {
  try {
    // 1. Validate inputs
    const parsed = signupSchema.safeParse(rawInput);
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

    const { name, email, password } = parsed.data;
    const normalizedEmail = email.toLowerCase().trim();

    // 2. Check if user already exists
    const existingUser = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      return {
        success: false,
        message: "An account with this email address already exists.",
        errors: { email: ["This email is already registered."] },
      };
    }

    // 3. Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // 4. Create user - Default role is strictly hardcoded to EMPLOYEE
    const user = await db.user.create({
      data: {
        name: name.trim(),
        email: normalizedEmail,
        passwordHash,
        role: "EMPLOYEE", // Hardcoded security role enforcement
        status: "ACTIVE",
      },
    });

    return {
      success: true,
      message: "Registration successful. You can now log in.",
      data: { id: user.id, email: user.email },
    };
  } catch (error: any) {
    console.error("Signup error:", error);
    return {
      success: false,
      message: "An unexpected error occurred during registration. Please try again.",
    };
  }
}

// Admin-only promote user action
export async function promoteUser(adminUserId: string, targetUserId: string, newRole: "ASSET_MANAGER" | "DEPARTMENT_HEAD" | "EMPLOYEE"): Promise<ActionResponse> {
  try {
    // Check if acting user is admin
    const adminUser = await db.user.findUnique({
      where: { id: adminUserId },
    });

    if (!adminUser || adminUser.role !== "ADMIN") {
      return {
        success: false,
        message: "Unauthorized. Only administrators can perform this action.",
      };
    }

    // Update role
    const updatedUser = await db.user.update({
      where: { id: targetUserId },
      data: { role: newRole },
    });

    // Write activity log
    await db.activityLog.create({
      data: {
        userId: adminUserId,
        action: "PROMOTE_USER",
        entityType: "User",
        entityId: targetUserId,
        newValues: { newRole }
      }
    });

    return {
      success: true,
      message: `Successfully promoted ${updatedUser.name} to ${newRole}.`,
      data: { id: updatedUser.id, role: updatedUser.role },
    };
  } catch (error: any) {
    console.error("Role promotion error:", error);
    return {
      success: false,
      message: "Failed to promote user. Please try again.",
    };
  }
}

// Stateless Password Reset Action
import crypto from "crypto";

export async function generateResetToken(email: string): Promise<ActionResponse> {
  try {
    if (!email) {
      return { success: false, message: "Email is required." };
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await db.user.findUnique({
      where: { email: normalizedEmail },
    });

    // Security practice: Prevent user enumeration by returning generic success message
    if (!user) {
      return {
        success: true,
        message: "If the email is registered, a password reset link has been simulated.",
      };
    }

    const expiresAt = Date.now() + 3600000; // 1 hour expiration
    const secret = (process.env.NEXTAUTH_SECRET || "default_secret") + user.passwordHash;
    const dataString = `${user.id}:${expiresAt}`;
    
    const signature = crypto
      .createHmac("sha256", secret)
      .update(dataString)
      .digest("hex");

    const token = Buffer.from(`${dataString}:${signature}`).toString("base64url");

    return {
      success: true,
      message: "Password reset link generated successfully.",
      data: {
        token,
        link: `/reset-password?token=${token}`,
      },
    };
  } catch (error) {
    console.error("Password reset token error:", error);
    return {
      success: false,
      message: "An error occurred during password reset generation.",
    };
  }
}

// Reset Password with Token Action
export async function validateAndResetPassword(rawInput: unknown): Promise<ActionResponse> {
  try {
    const inputSchema = z.object({
      token: z.string(),
      password: z.string().min(8, "Password must be at least 8 characters long.")
        .regex(/[a-z]/, "Password must contain at least one lowercase letter.")
        .regex(/[A-Z]/, "Password must contain at least one uppercase letter.")
        .regex(/[0-9]/, "Password must contain at least one number.")
        .regex(/[^a-zA-Z0-9]/, "Password must contain at least one special character."),
    });

    const parsed = inputSchema.safeParse(rawInput);
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

    const { token, password } = parsed.data;
    
    // Decode token
    const decoded = Buffer.from(token, "base64url").toString();
    const parts = decoded.split(":");
    if (parts.length !== 3) {
      return { success: false, message: "Invalid or malformed password reset token." };
    }

    const [userId, expiresAtStr, signature] = parts;
    const expiresAt = parseInt(expiresAtStr, 10);

    if (isNaN(expiresAt) || expiresAt < Date.now()) {
      return { success: false, message: "This password reset token has expired." };
    }

    const user = await db.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return { success: false, message: "User account not found." };
    }

    // Verify signature
    const secret = (process.env.NEXTAUTH_SECRET || "default_secret") + user.passwordHash;
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(`${userId}:${expiresAtStr}`)
      .digest("hex");

    if (signature !== expectedSignature) {
      return { success: false, message: "Invalid or tampered password reset token." };
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 10);

    // Update user password
    await db.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    // Write activity log
    await db.activityLog.create({
      data: {
        userId,
        action: "RESET_PASSWORD",
        entityType: "User",
        entityId: userId,
      },
    });

    return {
      success: true,
      message: "Password reset successfully. You can now log in with your new password.",
    };
  } catch (error) {
    console.error("Reset password error:", error);
    return {
      success: false,
      message: "An error occurred while resetting your password.",
    };
  }
}


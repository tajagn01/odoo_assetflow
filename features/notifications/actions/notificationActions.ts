"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { NotificationService } from "../services/NotificationService";

export interface StandardActionResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: {
    code: string;
    message: string;
  };
}

/**
 * Fetch all notifications for the authenticated user session
 */
export async function getNotificationsAction(): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "You must be logged in to fetch alerts.",
        },
      };
    }

    const data = await NotificationService.getUserNotifications(session.user.id);
    return {
      success: true,
      data,
      message: "Notifications fetched successfully.",
    };
  } catch (err: any) {
    console.error("Action Error (getNotificationsAction):", err);
    return {
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: err.message || "An unexpected error occurred.",
      },
    };
  }
}

/**
 * Mark a single notification as read
 */
export async function markAsReadAction(id: string): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      };
    }

    const data = await NotificationService.markNotificationAsRead(id, session.user.id);
    return {
      success: true,
      data,
      message: "Notification marked as read.",
    };
  } catch (err: any) {
    console.error("Action Error (markAsReadAction):", err);
    return {
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: err.message || "Failed to update notification.",
      },
    };
  }
}

/**
 * Dismiss/mark all notifications as read for the current user
 */
export async function markAllAsReadAction(): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return {
        success: false,
        error: {
          code: "UNAUTHORIZED",
          message: "Authentication required.",
        },
      };
    }

    const count = await NotificationService.markAllNotificationsAsRead(session.user.id);
    return {
      success: true,
      data: { count },
      message: `${count} notifications marked as read.`,
    };
  } catch (err: any) {
    console.error("Action Error (markAllAsReadAction):", err);
    return {
      success: false,
      error: {
        code: "UNEXPECTED_ERROR",
        message: err.message || "Failed to update notifications.",
      },
    };
  }
}

/**
 * Toggle pin status of a notification
 */
export async function togglePinAction(id: string, isPinned: boolean): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Auth required." } };
    }
    const data = await NotificationService.togglePin(id, session.user.id, isPinned);
    return { success: true, data, message: "Pin status toggled." };
  } catch (err: any) {
    return { success: false, error: { code: "ERROR", message: err.message } };
  }
}

/**
 * Toggle archive status of a notification
 */
export async function toggleArchiveAction(id: string, isArchived: boolean): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Auth required." } };
    }
    const data = await NotificationService.toggleArchive(id, session.user.id, isArchived);
    return { success: true, data, message: "Archive status toggled." };
  } catch (err: any) {
    return { success: false, error: { code: "ERROR", message: err.message } };
  }
}

/**
 * Delete a notification
 */
export async function deleteNotificationAction(id: string): Promise<StandardActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user) {
      return { success: false, error: { code: "UNAUTHORIZED", message: "Auth required." } };
    }
    await NotificationService.deleteNotification(id, session.user.id);
    return { success: true, message: "Notification deleted." };
  } catch (err: any) {
    return { success: false, error: { code: "ERROR", message: err.message } };
  }
}


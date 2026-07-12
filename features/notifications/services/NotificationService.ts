import { NotificationRepository } from "../repositories/NotificationRepository";
import { Notification } from "@prisma/client";

export class NotificationService {
  /**
   * Fetch all notifications for a user. Throws error if userId is missing.
   */
  static async getUserNotifications(userId: string): Promise<Notification[]> {
    if (!userId) {
      throw new Error("User identifier is required to fetch notifications.");
    }
    return await NotificationRepository.findManyByUserId(userId);
  }

  /**
   * Mark a specific notification as read. Validates user ownership.
   */
  static async markNotificationAsRead(
    id: string,
    userId: string
  ): Promise<Notification> {
    if (!id || !userId) {
      throw new Error("Missing notification identifier or user context.");
    }
    return await NotificationRepository.updateIsRead(id, userId, true);
  }

  /**
   * Mark all notifications for a user as read.
   */
  static async markAllNotificationsAsRead(userId: string): Promise<number> {
    if (!userId) {
      throw new Error("User context is required to dismiss notifications.");
    }
    return await NotificationRepository.updateAllIsRead(userId);
  }

  /**
   * Dispatch a notification to a specific user (System-wide trigger utility)
   */
  static async sendSystemNotification(
    userId: string,
    title: string,
    message: string
  ): Promise<Notification> {
    if (!userId || !title.trim() || !message.trim()) {
      throw new Error("Invalid arguments for system notification dispatch.");
    }
    return await NotificationRepository.create(userId, title, message);
  }

  /**
   * Toggle pinned state
   */
  static async togglePin(id: string, userId: string, isPinned: boolean): Promise<Notification> {
    if (!id || !userId) {
      throw new Error("Invalid arguments for notification update.");
    }
    return await NotificationRepository.togglePin(id, userId, isPinned);
  }

  /**
   * Toggle archived state
   */
  static async toggleArchive(id: string, userId: string, isArchived: boolean): Promise<Notification> {
    if (!id || !userId) {
      throw new Error("Invalid arguments for notification update.");
    }
    return await NotificationRepository.toggleArchive(id, userId, isArchived);
  }

  /**
   * Delete notification
   */
  static async deleteNotification(id: string, userId: string): Promise<Notification> {
    if (!id || !userId) {
      throw new Error("Invalid arguments for notification deletion.");
    }
    return await NotificationRepository.deleteNotification(id, userId);
  }
}


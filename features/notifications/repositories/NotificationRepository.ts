import { db } from "@/lib/db";
import { Notification } from "@prisma/client";

export class NotificationRepository {
  /**
   * Fetch all active notifications for a given user ordered by creation date desc
   */
  static async findManyByUserId(userId: string): Promise<Notification[]> {
    return await db.notification.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  }

  /**
   * Update the isRead status of an individual notification
   */
  static async updateIsRead(
    id: string,
    userId: string,
    isRead: boolean
  ): Promise<Notification> {
    return await db.notification.update({
      where: { id, userId },
      data: { isRead },
    });
  }

  /**
   * Mark all notifications for a given user as read
   */
  static async updateAllIsRead(userId: string): Promise<number> {
    const result = await db.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count;
  }

  /**
   * Create a new notification record in the database
   */
  static async create(
    userId: string,
    title: string,
    message: string
  ): Promise<Notification> {
    return await db.notification.create({
      data: {
        userId,
        title,
        message,
        isRead: false,
      },
    });
  }

  /**
   * Update the pinned status by writing to metadata
   */
  static async togglePin(id: string, userId: string, isPinned: boolean): Promise<Notification> {
    const existing = await db.notification.findFirst({ where: { id, userId } });
    const existingMeta = (existing?.metadata as Record<string, any>) || {};
    return await db.notification.update({
      where: { id, userId },
      data: {
        metadata: {
          ...existingMeta,
          isPinned,
        },
      },
    });
  }

  /**
   * Update the archived status by writing to metadata
   */
  static async toggleArchive(id: string, userId: string, isArchived: boolean): Promise<Notification> {
    const existing = await db.notification.findFirst({ where: { id, userId } });
    const existingMeta = (existing?.metadata as Record<string, any>) || {};
    return await db.notification.update({
      where: { id, userId },
      data: {
        metadata: {
          ...existingMeta,
          isArchived,
        },
      },
    });
  }

  /**
   * Hard delete a notification from the user's list
   */
  static async deleteNotification(id: string, userId: string): Promise<Notification> {
    return await db.notification.delete({
      where: { id, userId },
    });
  }
}


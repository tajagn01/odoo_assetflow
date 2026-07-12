"use server";

import { db } from "@/lib/db";
import { auth } from "@/lib/auth";
import { BookingStatus, AssetStatus } from "@prisma/client";
import { ActionResponse } from "./auth";

// Fetch bookings for a shared resource
export async function getBookings(assetId: string) {
  try {
    return await db.resourceBooking.findMany({
      where: {
        assetId,
        // Fetch all bookings so they appear correctly in the multi-view calendar
        status: { notIn: [BookingStatus.REJECTED, BookingStatus.EXPIRED] }
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        asset: { select: { id: true, name: true, tag: true, location: true } }
      },
      orderBy: { startTime: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }
}

// Fetch all bookings for list views and agenda views
export async function getAllBookings() {
  try {
    const session = await auth();
    if (!session) return [];

    // Filter by role
    const isAdmin = session.user.role === "ADMIN";
    const isManager = session.user.role === "ASSET_MANAGER";

    if (isAdmin || isManager) {
      return await db.resourceBooking.findMany({
        include: {
          user: { select: { id: true, name: true, email: true } },
          asset: { select: { id: true, name: true, tag: true, location: true } }
        },
        orderBy: { startTime: "desc" },
      });
    }

    const userProfile = await db.user.findUnique({
      where: { id: session.user.id },
      include: { department: true }
    });
    const userDeptName = userProfile?.department?.name || "";

    // Employees and Dept Heads see department bookings or their own
    return await db.resourceBooking.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { department: userDeptName }
        ]
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
        asset: { select: { id: true, name: true, tag: true, location: true } }
      },
      orderBy: { startTime: "desc" },
    });
  } catch (err) {
    console.error("Failed to fetch all bookings:", err);
    return [];
  }
}

// Create a booking with conflict overlap and working hours validation
export async function createBooking(data: {
  assetId: string;
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
  attendees?: string;
  priority?: string;
  department?: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in first." };
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    // Validation checks
    if (start >= end) {
      return { success: false, message: "End time must be after start time." };
    }

    if (start < new Date()) {
      return { success: false, message: "Cannot book slots in the past." };
    }

    // Working hours validation: e.g. 08:00 to 18:00
    const startHour = start.getHours();
    const endHour = end.getHours();
    if (startHour < 8 || endHour > 18 || (endHour === 18 && end.getMinutes() > 0)) {
      return { success: false, message: "Bookings must fall within organization working hours (08:00 to 18:00)." };
    }

    const result = await db.$transaction(async (tx) => {
      // 1. Fetch asset details
      const asset = await tx.asset.findUnique({
        where: { id: data.assetId },
      });

      if (!asset || asset.deletedAt !== null) {
        throw new Error("Shared resource not found.");
      }

      if (!asset.isSharedResource) {
        throw new Error("This asset is not configured as a shared/bookable resource.");
      }

      if (asset.status === AssetStatus.UNDER_MAINTENANCE) {
        throw new Error("This resource is currently under maintenance and cannot be booked.");
      }

      if (asset.status === AssetStatus.RETIRED || asset.status === AssetStatus.DISPOSED) {
        throw new Error("This resource has been retired or disposed.");
      }

      // 2. Overlap validation
      const overlappingBookingsCount = await tx.resourceBooking.count({
        where: {
          assetId: data.assetId,
          status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.UPCOMING, BookingStatus.ONGOING] },
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } }
          ]
        },
      });

      if (overlappingBookingsCount > 0) {
        throw new Error("Time slot overlap detected! This resource is already reserved for the selected time.");
      }

      // 3. Create booking record
      const booking = await tx.resourceBooking.create({
        data: {
          assetId: data.assetId,
          userId: session.user.id,
          startTime: start,
          endTime: end,
          status: BookingStatus.UPCOMING,
          purpose: data.purpose,
          notes: data.notes || "",
          attendees: data.attendees || "",
          priority: data.priority || "MEDIUM",
          department: data.department || "",
        },
      });

      // 4. Log activity
      await tx.activityLog.create({
        data: {
          userId: session.user.id,
          action: "CREATE_BOOKING",
          entityType: "ResourceBooking",
          entityId: booking.id,
          newValues: booking,
        },
      });

      // 5. Dispatch confirmation notification
      await tx.notification.create({
        data: {
          userId: session.user.id,
          title: "Resource Booked Successfully",
          message: `Your reservation for [${asset.tag}] ${asset.name} from ${start.toLocaleString()} to ${end.toLocaleString()} is confirmed.`,
          type: "BOOKING",
          metadata: { bookingId: booking.id }
        }
      });

      return booking;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Resource booked successfully.", data: result };
  } catch (error: any) {
    console.error("Failed to book resource:", error);
    return { success: false, message: error.message || "Failed to book resource." };
  }
}

// Edit or Reschedule booking
export async function updateBooking(bookingId: string, data: {
  startTime: string;
  endTime: string;
  purpose: string;
  notes?: string;
  attendees?: string;
  priority?: string;
  department?: string;
  status?: BookingStatus;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized." };

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { success: false, message: "End time must be after start time." };
    }

    // Working hours validation: e.g. 08:00 to 18:00
    const startHour = start.getHours();
    const endHour = end.getHours();
    if (startHour < 8 || endHour > 18 || (endHour === 18 && end.getMinutes() > 0)) {
      return { success: false, message: "Bookings must fall within organization working hours (08:00 to 18:00)." };
    }

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    // Auth check
    const isOwner = booking.userId === session.user.id;
    const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);
    if (!isOwner && !isPowerUser) {
      return { success: false, message: "You are not authorized to edit this booking." };
    }

    // Check overlap excluding this booking itself
    const overlapCount = await db.resourceBooking.count({
      where: {
        assetId: booking.assetId,
        id: { not: bookingId },
        status: { in: [BookingStatus.PENDING, BookingStatus.APPROVED, BookingStatus.UPCOMING, BookingStatus.ONGOING] },
        AND: [
          { startTime: { lt: end } },
          { endTime: { gt: start } }
        ]
      }
    });

    if (overlapCount > 0) {
      return { success: false, message: "Time slot overlap detected with an existing reservation." };
    }

    const updated = await db.resourceBooking.update({
      where: { id: bookingId },
      data: {
        startTime: start,
        endTime: end,
        purpose: data.purpose,
        notes: data.notes || "",
        attendees: data.attendees || "",
        priority: data.priority || "MEDIUM",
        department: data.department || "",
        status: data.status || booking.status
      }
    });

    // Log Activity
    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "UPDATE_BOOKING",
        entityType: "ResourceBooking",
        entityId: bookingId,
        previousValues: booking,
        newValues: updated
      }
    });

    // Notify user
    await db.notification.create({
      data: {
        userId: booking.userId,
        title: "Booking Rescheduled",
        message: `Your reservation has been updated to: ${start.toLocaleString()} - ${end.toLocaleString()}.`,
        type: "BOOKING",
        metadata: { bookingId }
      }
    });

    return { success: true, message: "Booking updated successfully.", data: updated };
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to update booking." };
  }
}

// Cancel booking
export async function cancelBooking(bookingId: string): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    const isOwner = booking.userId === session.user.id;
    const isPowerUser = ["ADMIN", "ASSET_MANAGER"].includes(session.user.role);

    if (!isOwner && !isPowerUser) {
      return { success: false, message: "You are not authorized to cancel this booking." };
    }

    const updated = await db.resourceBooking.update({
      where: { id: bookingId },
      data: { status: BookingStatus.CANCELLED },
    });

    await db.activityLog.create({
      data: {
        userId: session.user.id,
        action: "CANCEL_BOOKING",
        entityType: "ResourceBooking",
        entityId: bookingId,
      },
    });

    // Dispatch cancellation notification
    await db.notification.create({
      data: {
        userId: booking.userId,
        title: "Booking Cancelled",
        message: `Your reservation starting ${new Date(booking.startTime).toLocaleString()} has been cancelled.`,
        type: "BOOKING",
        metadata: { bookingId }
      }
    });

    return { success: true, message: "Booking cancelled successfully.", data: updated };
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return { success: false, message: "Failed to cancel booking." };
  }
}

// Duplicate booking to a new time slot
export async function duplicateBooking(bookingId: string, data: {
  startTime: string;
  endTime: string;
}): Promise<ActionResponse> {
  try {
    const session = await auth();
    if (!session) return { success: false, message: "Unauthorized." };

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId }
    });

    if (!booking) return { success: false, message: "Source booking not found." };

    return await createBooking({
      assetId: booking.assetId,
      startTime: data.startTime,
      endTime: data.endTime,
      purpose: booking.purpose || "Duplicated Slot",
      notes: booking.notes || undefined,
      attendees: booking.attendees || undefined,
      priority: booking.priority || undefined,
      department: booking.department || undefined
    });
  } catch (err: any) {
    return { success: false, message: err.message || "Failed to duplicate booking." };
  }
}

// Fetch single booking details with audit logs
export async function getBookingDetails(bookingId: string) {
  try {
    return await db.resourceBooking.findUnique({
      where: { id: bookingId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        asset: { select: { id: true, name: true, tag: true, location: true } }
      }
    });
  } catch (err) {
    console.error(err);
    return null;
  }
}

// Enforce status transition matching current time
export async function autoTransitionBookings(): Promise<void> {
  try {
    const now = new Date();
    
    // UPCOMING -> ONGOING (if startTime <= now < endTime)
    await db.resourceBooking.updateMany({
      where: {
        status: BookingStatus.UPCOMING,
        startTime: { lte: now },
        endTime: { gt: now }
      },
      data: { status: BookingStatus.ONGOING }
    });

    // ONGOING -> COMPLETED (if endTime <= now)
    await db.resourceBooking.updateMany({
      where: {
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
        endTime: { lte: now }
      },
      data: { status: BookingStatus.COMPLETED }
    });
  } catch (err) {
    console.error("Auto transition bookings fail:", err);
  }
}

"use server";

import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { BookingStatus, AssetStatus } from "@prisma/client";
import { ActionResponse } from "./auth";

// Fetch bookings for a shared resource
export async function getBookings(assetId: string) {
  try {
    return await db.resourceBooking.findMany({
      where: {
        assetId,
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { startTime: "asc" },
    });
  } catch (error) {
    console.error("Failed to fetch bookings:", error);
    return [];
  }
}

// Create a booking with conflict overlap validation
export async function createBooking(data: {
  assetId: string;
  startTime: string;
  endTime: string;
}): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized. Please log in first." };
    }

    const start = new Date(data.startTime);
    const end = new Date(data.endTime);

    if (start >= end) {
      return { success: false, message: "End time must be after start time." };
    }

    if (start < new Date()) {
      return { success: false, message: "Cannot book slots in the past." };
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
          status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
          // Check for any temporal overlap:
          // (StartA < EndB) AND (EndA > StartB)
          AND: [
            { startTime: { lt: end } },
            { endTime: { gt: start } }
          ]
        },
      });

      if (overlappingBookingsCount > 0) {
        throw new Error("Time slot overlap detected! This resource is already booked for the selected time.");
      }

      // 3. Create booking record
      const booking = await tx.resourceBooking.create({
        data: {
          assetId: data.assetId,
          userId: session.user.id,
          startTime: start,
          endTime: end,
          status: BookingStatus.UPCOMING,
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

      return booking;
    }, { maxWait: 15000, timeout: 20000 });

    return { success: true, message: "Resource booked successfully.", data: result };
  } catch (error: any) {
    console.error("Failed to book resource:", error);
    return { success: false, message: error.message || "Failed to book resource." };
  }
}

// Cancel booking
export async function cancelBooking(bookingId: string): Promise<ActionResponse> {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return { success: false, message: "Unauthorized." };
    }

    const booking = await db.resourceBooking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return { success: false, message: "Booking not found." };
    }

    // Authorization check: Only booking owner, Admin or Asset Manager can cancel
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

    return { success: true, message: "Booking cancelled successfully.", data: updated };
  } catch (error) {
    console.error("Failed to cancel booking:", error);
    return { success: false, message: "Failed to cancel booking." };
  }
}

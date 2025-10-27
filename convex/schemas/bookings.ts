import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation } from "../_generated/server";
import { paginationOptsValidator } from "convex/server";
import { getCurrentUserOrThrow, getUserByIdOrThrow } from "../model/users";
import * as Bookings from "../model/bookings";

// Re-export validators and types from model
export { bookingStatus, bookingEvent } from "../model/bookings";
export type { BookingStatus, BookingEvent } from "../model/bookings";

export const bookings = defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    timestamp: v.number(),
    status: Bookings.bookingStatus,
    events: v.array(Bookings.bookingEvent),
    lastActionByUserId: v.optional(v.id("users")),
    videoCallStartedAt: v.optional(v.number()),
    videoCallEndedAt: v.optional(v.number()),
    videoCallDuration: v.optional(v.number()),
})
    // Indexes for pagination with descending timestamp order
    .index("by_fromUserId_timestamp", ["fromUserId", "timestamp"])
    .index("by_toUserId_timestamp", ["toUserId", "timestamp"])
    .index("by_fromUserId_status_timestamp", ["fromUserId", "status", "timestamp"])
    .index("by_toUserId_status_timestamp", ["toUserId", "status", "timestamp"]);

export const createBooking = mutation({
    args: {
        toUserId: v.id("users"),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Bookings.createBookingHelper(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.toUserId,
            timestamp: args.timestamp,
        });
    }
})

export const getMyBookingsPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
        status: v.optional(Bookings.bookingStatus),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await Bookings.getUserBookingsPaginated(ctx, {
            userId: currentUser._id,
            paginationOpts: args.paginationOpts,
            status: args.status,
        });
    }
})

export const acceptBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Bookings.acceptBookingHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    }
})

export const rejectBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Bookings.rejectBookingHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    }
})

export const cancelBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Bookings.cancelBookingHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    }
})

export const rescheduleBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
        newTimestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Bookings.rescheduleBookingHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
            newTimestamp: args.newTimestamp,
        });
    }
})

export const verifyBookingAndParticipants = internalQuery({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const booking = await Bookings.getBookingOrThrow(ctx, args.bookingId);

        if (booking.fromUserId !== args.userId && booking.toUserId !== args.userId) {
            throw new Error("User is not a participant in this booking");
        }

        const tutor = await getUserByIdOrThrow(ctx, booking.toUserId);
        const student = await getUserByIdOrThrow(ctx, booking.fromUserId);

        return {
            booking,
            tutor: {
                _id: tutor._id,
                name: tutor.name || tutor.email || "Unknown Tutor",
            },
            student: {
                _id: student._id,
                name: student.name || student.email || "Unknown Student",
            },
        };
    },
});

export const recordVideoCallStarted = internalMutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.bookingId, {
            videoCallStartedAt: Date.now(),
        });
    },
});

export const getBookingById = internalQuery({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        return booking;
    },
});

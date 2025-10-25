import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { mutation, query, MutationCtx, internalQuery, internalMutation } from "../_generated/server";
import { getCurrentUserOrThrow, getUserByIdOrThrow, isRole } from "../model/users";
import { Id } from "../_generated/dataModel";

export const bookingStatus = v.union(
    v.literal("pending"), // 1st status when booking is created
    v.literal("awaiting_payment"), // when payment is pending (automatically set when accepted)
    v.literal("processing_payment"), // when payment is being processed
    v.literal("confirmed"), // when payment is confirmed
    v.literal("canceled"), // when booking is canceled
    v.literal("completed"), // when booking is completed

    // Edge case statuses
    v.literal("rejected"), // when booking is rejected by tutor or student (any other role), who suggest a new time, and was not accepted by one side
    v.literal("awaiting_reschedule"), // when one party reschedules, waiting for the other to confirm (use lastActionByUserId to determine who proposed)
)

export type BookingStatus = Infer<typeof bookingStatus>;

// Event type definitions with metadata
export const bookingCreatedEventMetadata = v.object({
    scheduledTime: v.number(),
});

export const bookingAcceptedEventMetadata = v.object({
    wasReschedule: v.boolean(),
    acceptedTime: v.optional(v.number()),
});

export const bookingRejectedEventMetadata = v.object({
    wasReschedule: v.boolean(),
});

export const bookingRescheduledEventMetadata = v.object({
    oldTime: v.number(),
    newTime: v.number(),
    proposedBy: v.union(v.literal("tutor"), v.literal("student")),
});

export const bookingCanceledEventMetadata = v.object({
    reason: v.optional(v.string()),
});

export const bookingCompletedEventMetadata = v.object({
    completedAt: v.number(),
});

export const bookingPaymentInitiatedEventMetadata = v.object({
    amount: v.number(),
    currency: v.string(),
    stripeSessionId: v.string(),
});

export const bookingPaymentSucceededEventMetadata = v.object({
    amount: v.number(),
    currency: v.string(),
    stripePaymentIntentId: v.string(),
});

export const bookingPaymentFailedEventMetadata = v.object({
    reason: v.optional(v.string()),
});

export const bookingPaymentRefundedEventMetadata = v.object({
    amount: v.number(),
    currency: v.string(),
    stripePaymentIntentId: v.string(),
});

// Union type for all event metadata
export const bookingEventMetadata = v.union(
    bookingCreatedEventMetadata,
    bookingAcceptedEventMetadata,
    bookingRejectedEventMetadata,
    bookingRescheduledEventMetadata,
    bookingCanceledEventMetadata,
    bookingCompletedEventMetadata,
    bookingPaymentInitiatedEventMetadata,
    bookingPaymentSucceededEventMetadata,
    bookingPaymentFailedEventMetadata,
    bookingPaymentRefundedEventMetadata,
);

export const bookingEvent = v.object({
    timestamp: v.number(),
    userId: v.id("users"),
    type: v.union(
        v.literal("created"),
        v.literal("accepted"),
        v.literal("rejected"),
        v.literal("rescheduled"),
        v.literal("canceled"),
        v.literal("completed"),
        v.literal("payment_initiated"),
        v.literal("payment_succeeded"),
        v.literal("payment_failed"),
        v.literal("payment_refunded")
    ),
    metadata: bookingEventMetadata,
});

export type BookingEvent = Infer<typeof bookingEvent>;

// Helper function to add events to bookings
export async function addBookingEvent(
    ctx: MutationCtx,
    bookingId: Id<"bookings">,
    userId: Id<"users">,
    eventType: BookingEvent["type"],
    metadata: BookingEvent["metadata"]
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }

    const newEvent: BookingEvent = {
        timestamp: Date.now(),
        userId,
        type: eventType,
        metadata,
    };

    await ctx.db.patch(bookingId, {
        events: [...booking.events, newEvent],
        lastActionByUserId: userId,
    });

    return newEvent;
}

export const bookings = defineTable({
    fromUserId: v.id("users"),
    toUserId: v.id("users"),
    timestamp: v.number(),
    status: bookingStatus,
    events: v.array(bookingEvent), // Event history for audit trail
    lastActionByUserId: v.optional(v.id("users")), // Track who made the last action (for reschedule ping-pong)
    videoCallStartedAt: v.optional(v.number()), // When video call was started
    videoCallEndedAt: v.optional(v.number()), // When video call was ended
    videoCallDuration: v.optional(v.number()), // Duration in seconds
}).index("fromUserId", ["fromUserId"])
    .index("toUserId", ["toUserId"]);

export const createBooking = mutation({
    args: {
        toUserId: v.id("users"),
        timestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        const toUser = await getUserByIdOrThrow(ctx, args.toUserId);

        const now = Date.now();
        const bookingId = await ctx.db.insert("bookings", {
            fromUserId: currentUser._id,
            toUserId: toUser._id,
            timestamp: args.timestamp,
            status: "pending",
            events: [],
            lastActionByUserId: currentUser._id,
        });

        // Add creation event
        await addBookingEvent(ctx, bookingId, currentUser._id, "created", {
            scheduledTime: args.timestamp,
        });
    }
})

export const getMyBookings = query({
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        const isTutor = isRole(currentUser, "tutor");
        const index = isTutor ? "toUserId" : "fromUserId";

        const bookings = await ctx.db.query("bookings")
            .withIndex(index, (q) => q.eq(index, currentUser._id))
            .collect();

        const bookingsWithUsers = await Promise.all(bookings.map(async (booking) => {
            const toUser = await getUserByIdOrThrow(ctx, booking.toUserId);
            const fromUser = await getUserByIdOrThrow(ctx, booking.fromUserId);

            // Fetch user info for all events
            const eventsWithUsers = await Promise.all(booking.events.map(async (event) => {
                const eventUser = await getUserByIdOrThrow(ctx, event.userId);
                return {
                    ...event,
                    userName: eventUser.name || eventUser.email || "Unknown User",
                };
            }));

            return {
                booking: {
                    ...booking,
                    events: eventsWithUsers,
                },
                toUser,
                fromUser,
                currentUser
            };
        }));

        return bookingsWithUsers;
    }
})

export const acceptBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Only the recipient (toUser) or sender (fromUser) can accept
        if (booking.toUserId !== currentUser._id && booking.fromUserId !== currentUser._id) {
            throw new Error("Not authorized to accept this booking");
        }

        // For reschedules, only the person who DIDN'T propose can accept
        const isAwaitingReschedule = booking.status === "awaiting_reschedule";

        if (isAwaitingReschedule && booking.lastActionByUserId === currentUser._id) {
            throw new Error("Cannot accept your own reschedule proposal. The other party must accept.");
        }

        // Can only accept pending or awaiting reschedule confirmation bookings
        if (booking.status !== "pending" && !isAwaitingReschedule) {
            throw new Error("Can only accept pending bookings");
        }

        await ctx.db.patch(args.bookingId, {
            status: "awaiting_payment",
        });

        // Add acceptance event
        await addBookingEvent(ctx, args.bookingId, currentUser._id, "accepted", {
            wasReschedule: isAwaitingReschedule,
            acceptedTime: isAwaitingReschedule ? booking.timestamp : undefined,
        });
    }
})

export const rejectBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Only the recipient (toUser) or sender (fromUser) can reject
        if (booking.toUserId !== currentUser._id && booking.fromUserId !== currentUser._id) {
            throw new Error("Not authorized to reject this booking");
        }

        // Can only reject pending or awaiting reschedule confirmation bookings
        const isAwaitingReschedule = booking.status === "awaiting_reschedule";

        if (booking.status !== "pending" && !isAwaitingReschedule) {
            throw new Error("Can only reject pending bookings");
        }

        await ctx.db.patch(args.bookingId, {
            status: "rejected",
        });

        // Add rejection event
        await addBookingEvent(ctx, args.bookingId, currentUser._id, "rejected", {
            wasReschedule: isAwaitingReschedule,
        });
    }
})

export const cancelBooking = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Only the recipient (toUser) or sender (fromUser) can cancel
        if (booking.toUserId !== currentUser._id && booking.fromUserId !== currentUser._id) {
            throw new Error("Not authorized to cancel this booking");
        }

        // Cannot cancel already completed or canceled bookings
        if (booking.status === "completed" || booking.status === "canceled") {
            throw new Error("Cannot cancel a completed or already canceled booking");
        }

        await ctx.db.patch(args.bookingId, {
            status: "canceled",
        });

        // Add cancellation event
        await addBookingEvent(ctx, args.bookingId, currentUser._id, "canceled", {
            reason: undefined,
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
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Only the recipient (toUser) or sender (fromUser) can reschedule
        if (booking.toUserId !== currentUser._id && booking.fromUserId !== currentUser._id) {
            throw new Error("Not authorized to reschedule this booking");
        }

        // Cannot reschedule completed or canceled bookings
        if (booking.status === "completed" || booking.status === "canceled") {
            throw new Error("Cannot reschedule a completed or canceled booking");
        }

        // Prevent rescheduling twice in a row - must wait for other party to respond
        if (booking.lastActionByUserId === currentUser._id && booking.status === "awaiting_reschedule") {
            throw new Error("You have already proposed a reschedule. Please wait for the other party to respond.");
        }

        // Determine if current user is the tutor or student
        const currentUserRole = await ctx.db.get(currentUser._id);
        const isTutor = currentUserRole && isRole(currentUserRole, "tutor");

        await ctx.db.patch(args.bookingId, {
            timestamp: args.newTimestamp,
            status: "awaiting_reschedule",
        });

        // Add reschedule event
        await addBookingEvent(ctx, args.bookingId, currentUser._id, "rescheduled", {
            oldTime: booking.timestamp,
            newTime: args.newTimestamp,
            proposedBy: isTutor ? "tutor" : "student",
        });
    }
})

// Internal query to verify booking exists and get participants
export const verifyBookingAndParticipants = internalQuery({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        // Verify the user is part of this booking
        if (booking.fromUserId !== args.userId && booking.toUserId !== args.userId) {
            throw new Error("User is not a participant in this booking");
        }

        // Get both participants
        const tutor = await ctx.db.get(booking.toUserId);
        const student = await ctx.db.get(booking.fromUserId);

        if (!tutor || !student) {
            throw new Error("One or both participants not found");
        }

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

// Internal mutation to record video call started
export const recordVideoCallStarted = internalMutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);

        if (!booking) {
            throw new Error("Booking not found");
        }

        await ctx.db.patch(args.bookingId, {
            videoCallStartedAt: Date.now(),
        });
    },
});

// Internal query to get booking by ID (for Stripe action)
export const getBookingById = internalQuery({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const booking = await ctx.db.get(args.bookingId);
        return booking;
    },
});

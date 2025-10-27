import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { getCurrentUserOrThrow, getUserByIdOrThrow, isRole } from "./users";
import { Infer, v } from "convex/values";

// Status validator and type
export const bookingStatus = v.union(
    v.literal("pending"),
    v.literal("awaiting_payment"),
    v.literal("processing_payment"),
    v.literal("confirmed"),
    v.literal("canceled"),
    v.literal("completed"),
    v.literal("rejected"),
    v.literal("awaiting_reschedule"),
);

export type BookingStatus = Infer<typeof bookingStatus>;

// Event metadata validators
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

/**
 * Helper function to add events to bookings
 */
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

/**
 * Helper to verify booking exists and user has access
 */
export async function getBookingOrThrow(
    ctx: QueryCtx | MutationCtx,
    bookingId: Id<"bookings">
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }
    return booking;
}

/**
 * Helper to verify user has access to a booking
 */
export async function ensureBookingAccess(
    ctx: QueryCtx | MutationCtx,
    bookingId: Id<"bookings">,
    userId: Id<"users">
) {
    const booking = await getBookingOrThrow(ctx, bookingId);

    if (booking.fromUserId !== userId && booking.toUserId !== userId) {
        throw new Error("Not authorized to access this booking");
    }

    return booking;
}

/**
 * Helper to validate tutor-student relationship
 */
export async function validateTutorStudentRelationship(
    ctx: QueryCtx | MutationCtx,
    fromUserId: Id<"users">,
    toUserId: Id<"users">
) {
    const fromUser = await getUserByIdOrThrow(ctx, fromUserId);
    const toUser = await getUserByIdOrThrow(ctx, toUserId);

    const fromUserIsTutor = isRole(fromUser, "tutor");
    const toUserIsTutor = isRole(toUser, "tutor");

    if (fromUserIsTutor && toUserIsTutor) {
        throw new Error("Tutors cannot book sessions with other tutors");
    }

    if (!fromUserIsTutor && !toUserIsTutor) {
        throw new Error("Students cannot book sessions with other students");
    }

    return { fromUser, toUser };
}

/**
 * Helper to create a new booking
 */
export async function createBookingHelper(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        timestamp: number;
    }
) {
    await validateTutorStudentRelationship(ctx, args.fromUserId, args.toUserId);

    const bookingId = await ctx.db.insert("bookings", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        timestamp: args.timestamp,
        status: "pending",
        events: [],
        lastActionByUserId: args.fromUserId,
    });

    // Add creation event
    await addBookingEvent(ctx, bookingId, args.fromUserId, "created", {
        scheduledTime: args.timestamp,
    });

    return bookingId;
}

/**
 * Helper to accept a booking
 */
export async function acceptBookingHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const booking = await ensureBookingAccess(ctx, args.bookingId, args.userId);

    // For reschedules, only the person who DIDN'T propose can accept
    const isAwaitingReschedule = booking.status === "awaiting_reschedule";

    if (isAwaitingReschedule && booking.lastActionByUserId === args.userId) {
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
    await addBookingEvent(ctx, args.bookingId, args.userId, "accepted", {
        wasReschedule: isAwaitingReschedule,
        acceptedTime: isAwaitingReschedule ? booking.timestamp : undefined,
    });
}

/**
 * Helper to reject a booking
 */
export async function rejectBookingHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const booking = await ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only reject pending or awaiting reschedule confirmation bookings
    const isAwaitingReschedule = booking.status === "awaiting_reschedule";

    if (booking.status !== "pending" && !isAwaitingReschedule) {
        throw new Error("Can only reject pending bookings");
    }

    await ctx.db.patch(args.bookingId, {
        status: "rejected",
    });

    // Add rejection event
    await addBookingEvent(ctx, args.bookingId, args.userId, "rejected", {
        wasReschedule: isAwaitingReschedule,
    });
}

/**
 * Helper to cancel a booking
 */
export async function cancelBookingHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        reason?: string;
    }
) {
    const booking = await ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only cancel bookings that are not already completed or canceled
    if (booking.status === "completed" || booking.status === "canceled") {
        throw new Error("Cannot cancel a completed or already canceled booking");
    }

    await ctx.db.patch(args.bookingId, {
        status: "canceled",
    });

    // Add cancellation event
    await addBookingEvent(ctx, args.bookingId, args.userId, "canceled", {
        reason: args.reason,
    });
}

/**
 * Helper to reschedule a booking
 */
export async function rescheduleBookingHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        newTimestamp: number;
    }
) {
    const booking = await ensureBookingAccess(ctx, args.bookingId, args.userId);
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);

    // Can only reschedule confirmed or pending bookings
    if (booking.status !== "confirmed" && booking.status !== "pending") {
        throw new Error("Can only reschedule confirmed or pending bookings");
    }

    const proposedBy = isRole(currentUser, "tutor") ? "tutor" : "student";

    await ctx.db.patch(args.bookingId, {
        timestamp: args.newTimestamp,
        status: "awaiting_reschedule",
        lastActionByUserId: args.userId,
    });

    // Add reschedule event
    await addBookingEvent(ctx, args.bookingId, args.userId, "rescheduled", {
        oldTime: booking.timestamp,
        newTime: args.newTimestamp,
        proposedBy,
    });
}

/**
 * Helper to get bookings for a user
 */
export async function getUserBookings(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = isRole(currentUser, "tutor");
    const index = isTutor ? "toUserId" : "fromUserId";

    const bookings = await ctx.db.query("bookings")
        .withIndex(index, (q) => q.eq(index, userId))
        .collect();

    // Enrich bookings with user info
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

/**
 * Helper to get a single booking with enriched data
 */
export async function getBookingWithUsers(
    ctx: QueryCtx,
    bookingId: Id<"bookings">
) {
    const booking = await getBookingOrThrow(ctx, bookingId);

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
    };
}

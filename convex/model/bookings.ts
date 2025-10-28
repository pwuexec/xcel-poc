import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { PaginationOptions, PaginationResult } from "convex/server";
import { getCurrentUserOrThrow, getUserByIdOrThrow, isRole } from "./users";
import { Infer, v } from "convex/values";
import {
    bookingStatus,
    BookingStatus,
    activeStatusFilter,
    pastStatusFilter,
    ActiveStatusFilter,
    PastStatusFilter,
    ACTIVE_STATUSES,
    PAST_STATUSES,
} from "../constants/bookingStatuses";
import { BOOKING_ERRORS } from "../constants/errors";

// Booking type validator and type
export const bookingType = v.union(v.literal("paid"), v.literal("free"));
export type BookingType = Infer<typeof bookingType>;

// Re-export for convenience
export { bookingStatus, ACTIVE_STATUSES, PAST_STATUSES };
export type { BookingStatus, ActiveStatusFilter, PastStatusFilter };

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

    // Query bookings in both directions using indexes
    const bookingsFromTo = await ctx.db
        .query("bookings")
        .withIndex("by_fromUserId_toUserId", (q) =>
            q.eq("fromUserId", args.fromUserId).eq("toUserId", args.toUserId)
        )
        .collect();

    const bookingsToFrom = await ctx.db
        .query("bookings")
        .withIndex("by_toUserId_fromUserId", (q) =>
            q.eq("toUserId", args.fromUserId).eq("fromUserId", args.toUserId)
        )
        .collect();

    const existingBookings = [...bookingsFromTo, ...bookingsToFrom];

    // Check if there's an active free meeting (pending, awaiting_reschedule, awaiting_payment, processing_payment, or confirmed)
    const activeFreeBooking = existingBookings.find(
        (booking) =>
            booking.bookingType === "free" &&
            ACTIVE_STATUSES.includes(booking.status as ActiveStatusFilter)
    );

    if (activeFreeBooking) {
        throw new Error(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
    }

    // Determine booking type
    // If there are no existing bookings, it's free
    // If there's a cancelled free booking, the new one is still free
    const hasCancelledFreeBooking = existingBookings.some(
        (booking) => booking.bookingType === "free" && booking.status === "canceled"
    );
    
    const isFirstBooking = existingBookings.length === 0;
    const bookingTypeValue: BookingType = (isFirstBooking || hasCancelledFreeBooking) ? "free" : "paid";

    const bookingId = await ctx.db.insert("bookings", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        timestamp: args.timestamp,
        status: "pending",
        bookingType: bookingTypeValue,
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

    // Can only accept pending or awaiting reschedule confirmation bookings
    if (booking.status !== "pending" && booking.status !== "awaiting_reschedule") {
        throw new Error("Can only accept pending or awaiting reschedule bookings");
    }

    // Only the person who DIDN'T make the last action can accept
    // This ensures the receiver accepts, not the requester
    if (booking.lastActionByUserId === args.userId) {
        throw new Error("Cannot accept your own booking request or reschedule proposal. The other party must accept.");
    }

    // For free meetings, go directly to confirmed. For paid meetings, go to awaiting_payment
    const newStatus = booking.bookingType === "free" ? "confirmed" : "awaiting_payment";

    await ctx.db.patch(args.bookingId, {
        status: newStatus,
    });

    // Add acceptance event
    await addBookingEvent(ctx, args.bookingId, args.userId, "accepted", {
        wasReschedule: booking.status === "awaiting_reschedule",
        acceptedTime: booking.status === "awaiting_reschedule" ? booking.timestamp : undefined,
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
    if (booking.status !== "pending" && booking.status !== "awaiting_reschedule") {
        throw new Error("Can only reject pending or awaiting reschedule bookings");
    }

    // Only the person who DIDN'T make the last action can reject
    // This ensures the receiver rejects, not the requester
    if (booking.lastActionByUserId === args.userId) {
        throw new Error("Cannot reject your own booking request or reschedule proposal. The other party must reject.");
    }

    await ctx.db.patch(args.bookingId, {
        status: "rejected",
    });

    // Add rejection event
    await addBookingEvent(ctx, args.bookingId, args.userId, "rejected", {
        wasReschedule: booking.status === "awaiting_reschedule",
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

    // Cannot reschedule completed, canceled, or rejected bookings
    if (booking.status === "completed" || booking.status === "canceled" || booking.status === "rejected") {
        throw new Error("Cannot reschedule completed, canceled, or rejected bookings");
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

    // Use new indexes
    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const bookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .order("desc")
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
 * Helper to get booking counts by category for a user
 */
export async function getUserBookingsCounts(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const currentUser = await getUserByIdOrThrow(ctx, userId);
    const isTutor = isRole(currentUser, "tutor");

    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    const bookings = await ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, userId))
        .collect();

    const pendingStatuses = ["pending", "awaiting_reschedule"] as const;

    const counts = {
        active: 0,
        past: 0,
        pending: 0,
    };

    bookings.forEach((booking) => {
        if (ACTIVE_STATUSES.includes(booking.status as ActiveStatusFilter)) {
            counts.active++;
        }
        if (PAST_STATUSES.includes(booking.status as PastStatusFilter)) {
            counts.past++;
        }
        if (pendingStatuses.includes(booking.status as typeof pendingStatuses[number])) {
            counts.pending++;
        }
    });

    return counts;
}

/**
 * Helper to get paginated bookings for a user
 */
export async function getUserBookingsPaginated(
    ctx: QueryCtx,
    args: {
        userId: Id<"users">;
        paginationOpts: PaginationOptions;
        statuses?: BookingStatus[];
    }
) {
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);
    const isTutor = isRole(currentUser, "tutor");

    const indexName = isTutor ? "by_toUserId_timestamp" : "by_fromUserId_timestamp";
    const fieldName = isTutor ? "toUserId" : "fromUserId";

    let query = ctx.db.query("bookings")
        .withIndex(indexName, (q) => q.eq(fieldName, args.userId))
        .order("desc");

    // Filter by statuses if provided
    if (args.statuses && args.statuses.length > 0) {
        query = query.filter((q) => {
            let condition = q.eq(q.field("status"), args.statuses![0]);
            for (let i = 1; i < args.statuses!.length; i++) {
                condition = q.or(condition, q.eq(q.field("status"), args.statuses![i]));
            }
            return condition;
        });
    }

    const paginationResult = await query.paginate(args.paginationOpts);

    // Enrich bookings with user info and unread message count
    const enrichedPage = await Promise.all(paginationResult.page.map(async (booking) => {
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

        // Get unread message count for this booking
        const messages = await ctx.db
            .query("messages")
            .withIndex("bookingId", (q) => q.eq("bookingId", booking._id))
            .collect();

        const unreadCount = messages.filter((message) => !message.readBy.includes(args.userId)).length;

        return {
            booking: {
                ...booking,
                events: eventsWithUsers,
            },
            toUser,
            fromUser,
            currentUser,
            unreadCount
        };
    }));

    return {
        ...paginationResult,
        page: enrichedPage,
    };
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

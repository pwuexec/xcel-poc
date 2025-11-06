import { Infer, v } from "convex/values";

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

export type BookingEvent = Infer<typeof bookingEvent>;
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

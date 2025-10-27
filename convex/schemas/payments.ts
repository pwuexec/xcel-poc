import { defineTable } from "convex/server";
import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import * as Payments from "../model/payments";

// Re-export validators and types from model
export { paymentStatus } from "../model/payments";
export type { PaymentStatus } from "../model/payments";

export const payments = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    stripeSessionId: v.string(),
    stripePaymentIntentId: v.optional(v.string()),
    amount: v.number(),
    currency: v.string(),
    status: Payments.paymentStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.object({
        description: v.optional(v.string()),
        receipt_email: v.optional(v.string()),
    })),
})
    .index("bookingId", ["bookingId"])
    .index("userId", ["userId"])
    .index("stripeSessionId", ["stripeSessionId"])
    .index("stripePaymentIntentId", ["stripePaymentIntentId"]);

// Internal mutation to create a payment (called by checkout action)
export const createPaymentInternal = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
        stripeSessionId: v.string(),
        amount: v.number(),
        currency: v.string(),
        metadata: v.optional(v.object({
            description: v.optional(v.string()),
            receipt_email: v.optional(v.string()),
        })),
    },
    handler: async (ctx, args) => {
        return await Payments.createPaymentHelper(ctx, {
            bookingId: args.bookingId,
            userId: args.userId,
            stripeSessionId: args.stripeSessionId,
            amount: args.amount,
            currency: args.currency,
            metadata: args.metadata,
        });
    },
});

// Internal mutation to update payment status (called by webhook)
export const updatePaymentStatus = internalMutation({
    args: {
        stripeSessionId: v.string(),
        stripePaymentIntentId: v.optional(v.string()),
        status: Payments.paymentStatus,
    },
    handler: async (ctx, args) => {
        await Payments.updatePaymentStatusHelper(ctx, {
            stripeSessionId: args.stripeSessionId,
            stripePaymentIntentId: args.stripePaymentIntentId,
            status: args.status,
        });
    },
});

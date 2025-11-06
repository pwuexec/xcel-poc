import { v } from "convex/values";
import { paymentStatus } from "../types/paymentStatus";
import { _updatePaymentStatusMutation } from "../cases/mutations/_updatePaymentStatusMutation";
import { internalMutation } from "../../_generated/server";
import { _createPaymentMutation } from "../cases/mutations/_createPaymentMutation";

/**
 * Internal mutation to update payment status (called by webhook)
 */
export const updatePaymentStatus = internalMutation({
    args: {
        stripeSessionId: v.string(),
        stripePaymentIntentId: v.optional(v.string()),
        status: paymentStatus,
    },
    handler: async (ctx, args) => {
        await _updatePaymentStatusMutation(ctx, {
            stripeSessionId: args.stripeSessionId,
            stripePaymentIntentId: args.stripePaymentIntentId,
            status: args.status,
        });
    },
});

/**
 * Internal mutation to create a payment (called by checkout action)
 */
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
        return await _createPaymentMutation(ctx, {
            bookingId: args.bookingId,
            userId: args.userId,
            stripeSessionId: args.stripeSessionId,
            amount: args.amount,
            currency: args.currency,
            metadata: args.metadata,
        });
    },
});

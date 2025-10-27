import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { Infer, v } from "convex/values";
import { addBookingEvent } from "./bookings";

// Payment status validator and type
export const paymentStatus = v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("succeeded"),
    v.literal("failed"),
    v.literal("canceled"),
    v.literal("refunded"),
);

export type PaymentStatus = Infer<typeof paymentStatus>;

/**
 * Helper to create a payment record
 */
export async function createPaymentHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        stripeSessionId: string;
        amount: number;
        currency: string;
        metadata?: {
            description?: string;
            receipt_email?: string;
        };
    }
) {
    const now = Date.now();

    const paymentId = await ctx.db.insert("payments", {
        bookingId: args.bookingId,
        userId: args.userId,
        stripeSessionId: args.stripeSessionId,
        amount: args.amount,
        currency: args.currency,
        status: "pending",
        createdAt: now,
        updatedAt: now,
        metadata: args.metadata,
    });

    return paymentId;
}

/**
 * Helper to update payment status
 */
export async function updatePaymentStatusHelper(
    ctx: MutationCtx,
    args: {
        stripeSessionId: string;
        stripePaymentIntentId?: string;
        status: PaymentStatus;
    }
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", args.stripeSessionId))
        .first();

    if (!payment) {
        throw new Error("Payment not found");
    }

    await ctx.db.patch(payment._id, {
        status: args.status,
        stripePaymentIntentId: args.stripePaymentIntentId,
        updatedAt: Date.now(),
    });

    // Update booking status and add event based on payment status
    if (args.status === "succeeded") {
        await ctx.db.patch(payment.bookingId, {
            status: "confirmed",
        });

        await addBookingEvent(
            ctx,
            payment.bookingId,
            payment.userId,
            "payment_succeeded",
            {
                amount: payment.amount,
                currency: payment.currency,
                stripePaymentIntentId: args.stripePaymentIntentId!,
            }
        );
    } else if (args.status === "failed") {
        await ctx.db.patch(payment.bookingId, {
            status: "awaiting_payment",
        });

        await addBookingEvent(
            ctx,
            payment.bookingId,
            payment.userId,
            "payment_failed",
            {
                reason: "Payment processing failed",
            }
        );
    } else if (args.status === "canceled") {
        await ctx.db.patch(payment.bookingId, {
            status: "awaiting_payment",
        });
    }

    return payment;
}

/**
 * Helper to get payment by booking ID
 */
export async function getPaymentByBookingId(
    ctx: QueryCtx,
    bookingId: Id<"bookings">
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("bookingId", (q) => q.eq("bookingId", bookingId))
        .first();

    return payment;
}

/**
 * Helper to get payment by Stripe session ID
 */
export async function getPaymentByStripeSessionId(
    ctx: QueryCtx,
    stripeSessionId: string
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", stripeSessionId))
        .first();

    return payment;
}

/**
 * Helper to get all payments for a user
 */
export async function getUserPayments(
    ctx: QueryCtx,
    userId: Id<"users">
) {
    const payments = await ctx.db
        .query("payments")
        .withIndex("userId", (q) => q.eq("userId", userId))
        .collect();

    return payments;
}

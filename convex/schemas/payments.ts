import { defineTable } from "convex/server";
import { Infer, v } from "convex/values";
import { mutation, query, internalMutation, MutationCtx } from "../_generated/server";
import { getCurrentUserOrThrow } from "../model/users";
import { Id } from "../_generated/dataModel";
import { addBookingEvent } from "./bookings";

export const paymentStatus = v.union(
    v.literal("pending"),      // Payment intent created, awaiting checkout
    v.literal("processing"),   // Payment submitted, being processed by Stripe
    v.literal("succeeded"),    // Payment successful
    v.literal("failed"),       // Payment failed
    v.literal("canceled"),     // Payment canceled
    v.literal("refunded"),     // Payment refunded (for future use)
);

export type PaymentStatus = Infer<typeof paymentStatus>;

export const payments = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),           // Who is making the payment
    stripeSessionId: v.string(),     // Stripe Checkout Session ID
    stripePaymentIntentId: v.optional(v.string()), // Stripe Payment Intent ID
    amount: v.number(),              // Amount in cents
    currency: v.string(),            // e.g., "usd", "eur"
    status: paymentStatus,
    createdAt: v.number(),
    updatedAt: v.number(),
    metadata: v.optional(v.object({
        // Additional metadata about the payment
        description: v.optional(v.string()),
        receipt_email: v.optional(v.string()),
    })),
})
    .index("bookingId", ["bookingId"])
    .index("userId", ["userId"])
    .index("stripeSessionId", ["stripeSessionId"])
    .index("stripePaymentIntentId", ["stripePaymentIntentId"]);

// Internal mutation to update payment status (called by webhook)
export const updatePaymentStatus = internalMutation({
    args: {
        stripeSessionId: v.string(),
        stripePaymentIntentId: v.optional(v.string()),
        status: paymentStatus,
    },
    handler: async (ctx, args) => {
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

            // Add payment succeeded event
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

            // Add payment failed event
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

            // Add payment failed event (canceled is treated as failed)
            await addBookingEvent(
                ctx,
                payment.bookingId,
                payment.userId,
                "payment_failed",
                {
                    reason: "Payment was canceled",
                }
            );
        } else if (args.status === "refunded") {
            // Add payment refunded event
            await addBookingEvent(
                ctx,
                payment.bookingId,
                payment.userId,
                "payment_refunded",
                {
                    amount: payment.amount,
                    currency: payment.currency,
                    stripePaymentIntentId: args.stripePaymentIntentId!,
                }
            );
        }

        return payment._id;
    },
});

// Internal mutation for creating payment (called from Stripe action)
export const createPaymentInternal = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
        stripeSessionId: v.string(),
        amount: v.number(),
        currency: v.string(),
    },
    handler: async (ctx, args) => {
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
        });

        // Update booking status
        await ctx.db.patch(args.bookingId, {
            status: "processing_payment",
        });

        // Add payment initiated event
        await addBookingEvent(
            ctx,
            args.bookingId,
            args.userId,
            "payment_initiated",
            {
                amount: args.amount,
                currency: args.currency,
                stripeSessionId: args.stripeSessionId,
            }
        );

        return paymentId;
    },
});

// Get payment by booking ID
export const getPaymentByBooking = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Only participants can view payment
        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to view this payment");
        }

        const payment = await ctx.db
            .query("payments")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .order("desc")
            .first();

        return payment;
    },
});

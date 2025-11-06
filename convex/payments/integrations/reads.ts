import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { _getUserPaymentsQuery } from "../cases/queries/_getUserPaymentsQuery";
import { _getPaymentByBookingIdQuery } from "../cases/queries/_getPaymentByBookingIdQuery";
import { _getPaymentByStripeSessionIdQuery } from "../cases/queries/_getPaymentByStripeSessionIdQuery";
import { getCurrentUserOrThrow } from "../../model/users";

/**
 * Public query to get all payments for the current user
 */
export const getMyPayments = query({
    args: {},
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getUserPaymentsQuery(ctx, currentUser._id);
    },
});

/**
 * Public query to get payment for a specific booking
 */
export const getPaymentForBooking = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        return await _getPaymentByBookingIdQuery(ctx, args.bookingId);
    },
});

/**
 * Internal query to get payment by Stripe session ID
 * Used by webhook processing
 */
export const getPaymentByStripeSessionIdInternal = internalQuery({
    args: {
        stripeSessionId: v.string(),
    },
    handler: async (ctx, args) => {
        return await _getPaymentByStripeSessionIdQuery(ctx, args.stripeSessionId);
    },
});

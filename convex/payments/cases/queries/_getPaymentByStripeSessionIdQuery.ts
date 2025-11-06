import { QueryCtx } from "../../../_generated/server";

/**
 * Helper to get payment by Stripe session ID
 */
export async function _getPaymentByStripeSessionIdQuery(
    ctx: QueryCtx,
    stripeSessionId: string
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("stripeSessionId", (q) => q.eq("stripeSessionId", stripeSessionId))
        .first();

    return payment;
}

import { Id } from "../../../_generated/dataModel";
import { QueryCtx } from "../../../_generated/server";

/**
 * Helper to get payment by booking ID
 */
export async function _getPaymentByBookingIdQuery(
    ctx: QueryCtx,
    bookingId: Id<"bookings">
) {
    const payment = await ctx.db
        .query("payments")
        .withIndex("bookingId", (q) => q.eq("bookingId", bookingId))
        .first();

    return payment;
}

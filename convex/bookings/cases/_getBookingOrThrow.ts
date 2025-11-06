import { MutationCtx, QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";

export async function _getBookingOrThrow(
    ctx: QueryCtx | MutationCtx,
    bookingId: Id<"bookings">
) {
    const booking = await ctx.db.get(bookingId);
    if (!booking) {
        throw new Error("Booking not found");
    }
    return booking;
}

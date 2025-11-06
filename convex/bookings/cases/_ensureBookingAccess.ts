import { MutationCtx, QueryCtx } from "../../_generated/server";
import { Id } from "../../_generated/dataModel";
import { _getBookingOrThrow } from "./_getBookingOrThrow";

export async function _ensureBookingAccess(
    ctx: QueryCtx | MutationCtx,
    bookingId: Id<"bookings">,
    userId: Id<"users">
) {
    const booking = await _getBookingOrThrow(ctx, bookingId);

    if (booking.fromUserId !== userId && booking.toUserId !== userId) {
        throw new Error("Not authorized to access this booking");
    }

    return booking;
}

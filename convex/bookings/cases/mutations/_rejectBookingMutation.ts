import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../_ensureBookingAccess";
import { _addBookingEventMutation } from "./_addBookingEventMutation";

export async function _rejectBookingMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only reject pending or awaiting reschedule confirmation bookings
    if (booking.status !== "pending" && booking.status !== "awaiting_reschedule") {
        throw new Error("Can only reject pending or awaiting reschedule bookings");
    }

    // Only the person who DIDN'T make the last action can reject
    // This ensures the receiver rejects, not the requester
    if (booking.lastActionByUserId === args.userId) {
        throw new Error("Cannot reject your own booking request or reschedule proposal. The other party must reject.");
    }

    await ctx.db.patch(args.bookingId, {
        status: "rejected",
    });

    // Add rejection event
    await _addBookingEventMutation(ctx, args.bookingId, args.userId, "rejected", {
        wasReschedule: booking.status === "awaiting_reschedule",
    });
}

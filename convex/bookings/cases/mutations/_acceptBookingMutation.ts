import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../_ensureBookingAccess";
import { _addBookingEventMutation } from "./_addBookingEventMutation";

export async function _acceptBookingMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Can only accept pending or awaiting reschedule confirmation bookings
    if (booking.status !== "pending" && booking.status !== "awaiting_reschedule") {
        throw new Error("Can only accept pending or awaiting reschedule bookings");
    }

    // Only the person who DIDN'T make the last action can accept
    // This ensures the receiver accepts, not the requester
    if (booking.lastActionByUserId === args.userId) {
        throw new Error("Cannot accept your own booking request or reschedule proposal. The other party must accept.");
    }

    // For free meetings, go directly to confirmed. For paid meetings, go to awaiting_payment
    const newStatus = booking.bookingType === "free" ? "confirmed" : "awaiting_payment";

    await ctx.db.patch(args.bookingId, {
        status: newStatus,
    });

    // Add acceptance event
    await _addBookingEventMutation(ctx, args.bookingId, args.userId, "accepted", {
        wasReschedule: booking.status === "awaiting_reschedule",
        acceptedTime: booking.status === "awaiting_reschedule" ? booking.timestamp : undefined,
    });
}

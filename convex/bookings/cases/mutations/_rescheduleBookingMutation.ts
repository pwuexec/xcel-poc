import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow, isRole } from "../../../model/users";
import { _ensureBookingAccess } from "../_ensureBookingAccess";
import { _addBookingEvent } from "../_addBookingEvent";

export async function _rescheduleBookingMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        newTimestamp: number;
    }
) {
    const booking = await _ensureBookingAccess(ctx, args.bookingId, args.userId);
    const currentUser = await getUserByIdOrThrow(ctx, args.userId);

    // Cannot reschedule completed, canceled, or rejected bookings
    if (booking.status === "completed" || booking.status === "canceled" || booking.status === "rejected") {
        throw new Error("Cannot reschedule completed, canceled, or rejected bookings");
    }

    const proposedBy = isRole(currentUser, "tutor") ? "tutor" : "student";

    await ctx.db.patch(args.bookingId, {
        timestamp: args.newTimestamp,
        status: "awaiting_reschedule",
        lastActionByUserId: args.userId,
    });

    // Add reschedule event
    await _addBookingEvent(ctx, args.bookingId, args.userId, "rescheduled", {
        oldTime: booking.timestamp,
        newTime: args.newTimestamp,
        proposedBy,
    });
}

import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _isRole } from "../../../users/cases/_isRole";
import { _ensureBookingAccess } from "../_ensureBookingAccess";
import { _validateBookingTimestamp } from "../_validateBookingTimestamp";
import { _addBookingEventMutation } from "./_addBookingEventMutation";

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

    // Validate new timestamp (not in past, no time conflicts)
    // Exclude the current booking from conflict check
    await _validateBookingTimestamp(ctx, {
        timestamp: args.newTimestamp,
        fromUserId: booking.fromUserId,
        toUserId: booking.toUserId,
        bookingType: booking.bookingType,
        excludeBookingId: args.bookingId,
    });

    const proposedBy = _isRole(currentUser, "tutor") ? "tutor" : "student";

    await ctx.db.patch(args.bookingId, {
        timestamp: args.newTimestamp,
        status: "awaiting_reschedule",
        lastActionByUserId: args.userId,
    });

    // Add reschedule event
    await _addBookingEventMutation(ctx, args.bookingId, args.userId, "rescheduled", {
        oldTime: booking.timestamp,
        newTime: args.newTimestamp,
        proposedBy,
    });
}

import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../../../bookings/cases/_ensureBookingAccess";

/**
 * Internal mutation to mark messages as read
 * Used by integrations/writes.ts
 */
export async function _markMessagesAsReadMutation(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    // Verify booking exists and user has access
    await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    const messages = await ctx.db
        .query("messages")
        .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
        .collect();

    // Mark unread messages as read
    await Promise.all(
        messages
            .filter((message) => !message.readBy.includes(args.userId))
            .map((message) =>
                ctx.db.patch(message._id, {
                    readBy: [...message.readBy, args.userId],
                })
            )
    );
}

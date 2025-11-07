import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";

/**
 * Internal query to get unread message count for a booking
 * Used by integrations/reads.ts
 */
export async function _getUnreadMessageCountQuery(
    ctx: QueryCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    const messages = await ctx.db
        .query("messages")
        .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
        .collect();

    return messages.filter((message) => !message.readBy.includes(args.userId)).length;
}

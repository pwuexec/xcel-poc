import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../../../bookings/cases/_ensureBookingAccess";
import { formatUserNameGDPR } from "../../../users/cases/_formatUserNameGDPR";

/**
 * Internal query to get messages for a booking with user info
 * Used by integrations/reads.ts
 */
export async function _getBookingMessagesQuery(
    ctx: QueryCtx,
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

    // Enrich messages with user info
    const messagesWithUsers = await Promise.all(
        messages.map(async (message) => {
            const user = await ctx.db.get(message.userId);
            return {
                ...message,
                userName: formatUserNameGDPR(user?.name) || user?.email || "Unknown User",
                userImage: user?.image,
            };
        })
    );

    return messagesWithUsers.sort((a, b) => a.timestamp - b.timestamp);
}

import { v } from "convex/values";
import { query } from "../../_generated/server";
import { getCurrentUserIdOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _getBookingMessagesQuery } from "../cases/queries/_getBookingMessagesQuery";
import { _getUnreadMessageCountQuery } from "../cases/queries/_getUnreadMessageCountQuery";

/**
 * Public query to get messages for a booking
 */
export const getBookingMessages = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        return await _getBookingMessagesQuery(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

/**
 * Public query to get unread message count for a booking
 */
export const getUnreadCount = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        return await _getUnreadMessageCountQuery(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

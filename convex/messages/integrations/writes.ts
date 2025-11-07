import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { getCurrentUserIdOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _sendMessageMutation } from "../cases/mutations/_sendMessageMutation";
import { _markMessagesAsReadMutation } from "../cases/mutations/_markMessagesAsReadMutation";

/**
 * Public mutation to send a message
 */
export const sendMessage = mutation({
    args: {
        bookingId: v.id("bookings"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        await _sendMessageMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
            message: args.message,
        });
    },
});

/**
 * Public mutation to mark messages as read
 */
export const markMessagesAsRead = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        await _markMessagesAsReadMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

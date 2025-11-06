import { MutationCtx, QueryCtx } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { _ensureBookingAccess } from "../bookings/cases/_ensureBookingAccess";

/**
 * Helper to send a message
 */
export async function sendMessageHelper(
    ctx: MutationCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
        message: string;
    }
) {
    // Verify booking exists and user has access
    await _ensureBookingAccess(ctx, args.bookingId, args.userId);

    // Trim and validate message
    const trimmedMessage = args.message.trim();
    if (!trimmedMessage) {
        throw new Error("Message cannot be empty");
    }

    if (trimmedMessage.length > 1000) {
        throw new Error("Message is too long (max 1000 characters)");
    }

    await ctx.db.insert("messages", {
        bookingId: args.bookingId,
        userId: args.userId,
        message: trimmedMessage,
        timestamp: Date.now(),
        readBy: [args.userId], // Sender has already "read" their own message
    });
}

/**
 * Helper to get messages for a booking with user info
 */
export async function getBookingMessagesHelper(
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
                userName: user?.name || user?.email || "Unknown User",
                userImage: user?.image,
            };
        })
    );

    return messagesWithUsers.sort((a, b) => a.timestamp - b.timestamp);
}

/**
 * Helper to mark messages as read
 */
export async function markMessagesAsReadHelper(
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

/**
 * Helper to get unread message count for a booking
 */
export async function getUnreadMessageCount(
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

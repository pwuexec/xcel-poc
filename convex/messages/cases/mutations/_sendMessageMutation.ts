import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { _ensureBookingAccess } from "../../../bookings/cases/_ensureBookingAccess";

/**
 * Internal mutation to send a message
 * Used by integrations/writes.ts
 */
export async function _sendMessageMutation(
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

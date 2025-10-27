import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserIdOrThrow } from "../model/users";
import * as Messages from "../model/messages";

export const messages = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    message: v.string(),
    timestamp: v.number(),
    readBy: v.array(v.id("users")),
})
    .index("bookingId", ["bookingId"])
    .index("timestamp", ["timestamp"]);

export const sendMessage = mutation({
    args: {
        bookingId: v.id("bookings"),
        message: v.string(),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        await Messages.sendMessageHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
            message: args.message,
        });
    },
});

export const getBookingMessages = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        return await Messages.getBookingMessagesHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

export const markMessagesAsRead = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        await Messages.markMessagesAsReadHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

export const getUnreadCount = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);

        return await Messages.getUnreadMessageCount(ctx, {
            bookingId: args.bookingId,
            userId: currentUserId,
        });
    },
});

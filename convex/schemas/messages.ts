import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../model/users";
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
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Messages.sendMessageHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
            message: args.message,
        });
    },
});

export const getBookingMessages = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        return await Messages.getBookingMessagesHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    },
});

export const markMessagesAsRead = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        await Messages.markMessagesAsReadHelper(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    },
});

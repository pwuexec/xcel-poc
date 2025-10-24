import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../model/users";
import { Id } from "../_generated/dataModel";

export const messages = defineTable({
    bookingId: v.id("bookings"),
    userId: v.id("users"),
    message: v.string(),
    timestamp: v.number(),
    readBy: v.array(v.id("users")), // Array of user IDs who have read this message
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

        // Verify booking exists
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Verify user is part of the booking
        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to send messages for this booking");
        }

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
            userId: currentUser._id,
            message: trimmedMessage,
            timestamp: Date.now(),
            readBy: [currentUser._id], // Sender has already "read" their own message
        });
    },
});

export const getBookingMessages = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Verify booking exists
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Verify user is part of the booking
        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to view messages for this booking");
        }

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
    },
});

export const markMessagesAsRead = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Verify booking exists
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        // Verify user is part of the booking
        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to mark messages as read for this booking");
        }

        // Get all messages for this booking
        const messages = await ctx.db
            .query("messages")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .collect();

        // Mark messages as read if current user hasn't read them yet
        for (const message of messages) {
            if (!message.readBy.includes(currentUser._id)) {
                await ctx.db.patch(message._id, {
                    readBy: [...message.readBy, currentUser._id],
                });
            }
        }
    },
});

export const getUnreadCount = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Verify booking exists
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            return 0;
        }

        // Verify user is part of the booking
        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            return 0;
        }

        // Get all messages for this booking
        const messages = await ctx.db
            .query("messages")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .collect();

        // Count unread messages (not sent by current user and not read by them)
        const unreadCount = messages.filter(
            (msg) => msg.userId !== currentUser._id && !msg.readBy.includes(currentUser._id)
        ).length;

        return unreadCount;
    },
});

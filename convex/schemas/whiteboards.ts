import { defineTable } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "../_generated/server";
import { getCurrentUserOrThrow } from "../model/users";
import { Id } from "../_generated/dataModel";

export const whiteboards = defineTable({
    bookingId: v.id("bookings"),
    elements: v.string(), // JSON stringified array of Excalidraw elements
    appState: v.string(), // JSON stringified app state
    lastUpdatedBy: v.id("users"),
    lastUpdatedAt: v.number(),
}).index("bookingId", ["bookingId"]);

// Query for authenticated users (normal flow)
export const getWhiteboardState = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Verify user has access to this booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to access this whiteboard");
        }

        // Find whiteboard for this booking
        const whiteboard = await ctx.db
            .query("whiteboards")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (!whiteboard) {
            // Return empty state if whiteboard doesn't exist yet
            return {
                elements: [],
                appState: { viewBackgroundColor: "#ffffff" },
            };
        }

        return {
            elements: JSON.parse(whiteboard.elements),
            appState: JSON.parse(whiteboard.appState),
        };
    },
});

// Query for token-based access (iframe flow)
export const getWhiteboardStateByToken = query({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        // Verify user has access to this booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.fromUserId !== args.userId && booking.toUserId !== args.userId) {
            throw new Error("Not authorized to access this whiteboard");
        }

        // Find whiteboard for this booking
        const whiteboard = await ctx.db
            .query("whiteboards")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .first();

        if (!whiteboard) {
            // Return empty state if whiteboard doesn't exist yet
            return {
                elements: [],
                appState: { viewBackgroundColor: "#ffffff" },
            };
        }

        return {
            elements: JSON.parse(whiteboard.elements),
            appState: JSON.parse(whiteboard.appState),
        };
    },
});

export const updateWhiteboardState = mutation({
    args: {
        bookingId: v.id("bookings"),
        elements: v.string(), // JSON stringified
        appState: v.string(), // JSON stringified
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);

        // Verify user has access to this booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.fromUserId !== currentUser._id && booking.toUserId !== currentUser._id) {
            throw new Error("Not authorized to update this whiteboard");
        }

        // Find existing whiteboard
        const existingWhiteboard = await ctx.db
            .query("whiteboards")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .first();

        const now = Date.now();

        if (existingWhiteboard) {
            // Update existing whiteboard
            await ctx.db.patch(existingWhiteboard._id, {
                elements: args.elements,
                appState: args.appState,
                lastUpdatedBy: currentUser._id,
                lastUpdatedAt: now,
            });
        } else {
            // Create new whiteboard
            await ctx.db.insert("whiteboards", {
                bookingId: args.bookingId,
                elements: args.elements,
                appState: args.appState,
                lastUpdatedBy: currentUser._id,
                lastUpdatedAt: now,
            });
        }
    },
});

// Mutation for token-based access (iframe flow)
export const updateWhiteboardStateByToken = mutation({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
        elements: v.string(), // JSON stringified
        appState: v.string(), // JSON stringified
    },
    handler: async (ctx, args) => {
        // Verify user has access to this booking
        const booking = await ctx.db.get(args.bookingId);
        if (!booking) {
            throw new Error("Booking not found");
        }

        if (booking.fromUserId !== args.userId && booking.toUserId !== args.userId) {
            throw new Error("Not authorized to update this whiteboard");
        }

        // Find existing whiteboard
        const existingWhiteboard = await ctx.db
            .query("whiteboards")
            .withIndex("bookingId", (q) => q.eq("bookingId", args.bookingId))
            .first();

        const now = Date.now();

        if (existingWhiteboard) {
            // Update existing whiteboard
            await ctx.db.patch(existingWhiteboard._id, {
                elements: args.elements,
                appState: args.appState,
                lastUpdatedBy: args.userId,
                lastUpdatedAt: now,
            });
        } else {
            // Create new whiteboard
            await ctx.db.insert("whiteboards", {
                bookingId: args.bookingId,
                elements: args.elements,
                appState: args.appState,
                lastUpdatedBy: args.userId,
                lastUpdatedAt: now,
            });
        }
    },
});

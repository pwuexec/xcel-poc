import { v } from "convex/values";
import { internalMutation, mutation } from "../../_generated/server";
import { _acceptBookingMutation } from "../cases/mutations/_acceptBookingMutation";
import { _rejectBookingMutation } from "../cases/mutations/_rejectBookingMutation";
import { _cancelBookingMutation } from "../cases/mutations/_cancelBookingMutation";
import { _rescheduleBookingMutation } from "../cases/mutations/_rescheduleBookingMutation";
import { _completeBookingMutation } from "../cases/mutations/_completeBookingMutation";
import { _addLessonSpaceUrlMutation } from "../cases/mutations/_addLessonSpaceUrlMutation";
import { getCurrentUserOrThrow } from "../../model/users";
import { _createBookingMutation } from "../cases/mutations/_createBookingMutation";

/**
 * Public mutation to create a new booking
 */
export const createBookingMutation = mutation({
    args: {
        toUserId: v.id("users"),
        timestamp: v.number(),
        bookingType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _createBookingMutation(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.toUserId,
            timestamp: args.timestamp,
            bookingType: args.bookingType,
        });
    },
});

/**
 * Public mutation to accept a booking
 */
export const acceptBookingMutation = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _acceptBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    },
});

/**
 * Public mutation to reject a booking
 */
export const rejectBookingMutation = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _rejectBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    },
});

/**
 * Public mutation to cancel a booking
 */
export const cancelBookingMutation = mutation({
    args: {
        bookingId: v.id("bookings"),
        reason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _cancelBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
            reason: args.reason,
        });
    },
});

/**
 * Public mutation to reschedule a booking
 */
export const rescheduleBookingMutation = mutation({
    args: {
        bookingId: v.id("bookings"),
        newTimestamp: v.number(),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _rescheduleBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
            newTimestamp: args.newTimestamp,
        });
    },
});

/**
 * Public mutation to complete a booking
 */
export const completeBookingMutation = mutation({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _completeBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: currentUser._id,
        });
    },
});

export const addLessonSpaceUrl = internalMutation({
    args: {
        bookingId: v.id("bookings"),
        lessonSpaceUrl: v.string(),
    },
    handler: async (ctx, args) => {
        return await _addLessonSpaceUrlMutation(ctx, args);
    },
});

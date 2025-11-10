import { v } from "convex/values";
import { mutation } from "../../_generated/server";
import { _acceptBookingMutation } from "../cases/mutations/_acceptBookingMutation";
import { _rejectBookingMutation } from "../cases/mutations/_rejectBookingMutation";
import { _cancelBookingMutation } from "../cases/mutations/_cancelBookingMutation";
import { _rescheduleBookingMutation } from "../cases/mutations/_rescheduleBookingMutation";
import { _completeBookingMutation } from "../cases/mutations/_completeBookingMutation";
import { getCurrentUserIdOrThrow, getCurrentUserOrThrow } from "../../users/cases/queries/_getCurrentUserQuery";
import { _createBookingMutation } from "../cases/mutations/_createBookingMutation";
import { _isRole } from "../../users/cases/_isRole";

/**
 * Public mutation to create a new booking
 * Note: fromUserId is always the student, toUserId is always the tutor
 */
export const createBookingMutation = mutation({
    args: {
        toUserId: v.id("users"),
        timestamp: v.number(),
        bookingType: v.optional(v.union(v.literal("free"), v.literal("paid"))),
    },
    handler: async (ctx, args) => {
        const currentUserId = await getCurrentUserIdOrThrow(ctx);
        const currentUser = await getCurrentUserOrThrow(ctx);
        const isTutor = _isRole(currentUser, "tutor");
        
        // fromUserId is always the student, toUserId is always the tutor
        const fromUserId = isTutor ? args.toUserId : currentUserId;
        const toUserId = isTutor ? currentUserId : args.toUserId;
        
        return await _createBookingMutation(ctx, {
            fromUserId,
            toUserId,
            timestamp: args.timestamp,
            bookingType: args.bookingType,
            createdByUserId: currentUserId, // Pass the actual creator
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
        return await _acceptBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: await getCurrentUserIdOrThrow(ctx),
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
        return await _rejectBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: await getCurrentUserIdOrThrow(ctx),
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
        return await _cancelBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: await getCurrentUserIdOrThrow(ctx),
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
        return await _rescheduleBookingMutation(ctx, {
            bookingId: args.bookingId,
            userId: await getCurrentUserIdOrThrow(ctx),
            newTimestamp: args.newTimestamp,
        });
    },
});
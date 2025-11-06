import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { _verifyBookingAndParticipantsQuery } from "../cases/queries/_verifyBookingAndParticipantsQuery";
import { _getUserBookingsPaginatedQuery } from "../cases/queries/_getUserBookingsPaginatedQuery";
import { getCurrentUserOrThrow } from "../../model/users";
import { _getUserBookingsCountsQuery } from "../cases/queries/_getUserBookingsCountsQuery";
import { _getBookingWithUsersQuery } from "../cases/queries/_getBookingWithUsersQuery";
import { _getBookingEligibilityQuery } from "../cases/queries/_getBookingEligibilityQuery";
import { paginationOptsValidator } from "convex/server";

/**
 * Internal query to verify a booking exists and that a user is a participant
 * Called by external integrations (LessonSpace, video calls, etc.)
 */
export const verifyBookingAndParticipantsQuery = internalQuery({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
    },
    handler: async (ctx, args) => {
        return await _verifyBookingAndParticipantsQuery(ctx, args);
    },
});

/**
 * Public query to get paginated bookings for the current user
 */
export const getMyBookingsPaginated = query({
    args: {
        paginationOpts: paginationOptsValidator,
        statuses: v.optional(v.array(v.string())),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getUserBookingsPaginatedQuery(ctx, {
            userId: currentUser._id,
            paginationOpts: args.paginationOpts,
            statuses: args.statuses,
        });
    },
});

/**
 * Public query to get booking counts by status for the current user
 */
export const getMyBookingsCountsQuery = query({
    args: {},
    handler: async (ctx) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getUserBookingsCountsQuery(ctx, currentUser._id);
    },
});

/**
 * Public query to get a single booking with user details
 */
export const getBookingWithUsersQuery = query({
    args: {
        bookingId: v.id("bookings"),
    },
    handler: async (ctx, args) => {
        return await _getBookingWithUsersQuery(ctx, args.bookingId);
    },
});

/**
 * Public query to check booking eligibility with another user
 * Returns what booking types are available
 */
export const getBookingEligibility = query({
    args: {
        otherUserId: v.id("users"),
    },
    handler: async (ctx, args) => {
        const currentUser = await getCurrentUserOrThrow(ctx);
        return await _getBookingEligibilityQuery(ctx, {
            fromUserId: currentUser._id,
            toUserId: args.otherUserId,
        });
    },
});

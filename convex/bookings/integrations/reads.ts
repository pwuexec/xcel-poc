import { v } from "convex/values";
import { internalQuery, query } from "../../_generated/server";
import { _verifyBookingAndParticipantsQuery } from "../cases/queries/_verifyBookingAndParticipantsQuery";
import { _getUserBookingsPaginatedQuery } from "../cases/queries/_getUserBookingsPaginatedQuery";
import { getCurrentUserOrThrow } from "../../model/users";
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
 * Optimized query to get bookings with counts in a single call
 * Returns paginated bookings with all necessary data and status counts
 */
export const getMyBookingsWithCounts = query({
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
            includeCounts: true,
        });
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

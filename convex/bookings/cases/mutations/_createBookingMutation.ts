import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { BookingType } from "../../types/bookingType";
import { BOOKING_ERRORS } from "../../../constants/errors";
import { _validateTutorStudentRelationship } from "../_validateTutorStudentRelationship";
import { _validateBookingTimestamp } from "../_validateBookingTimestamp";
import { _addBookingEventMutation } from "./_addBookingEventMutation";
import { _getBookingEligibilityQuery } from "../queries/_getBookingEligibilityQuery";

export async function _createBookingMutation(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        timestamp: number;
        bookingType?: BookingType;
        recurringRuleId?: Id<"recurringRules">; // Link to recurring rule if created from one
        skipRecurringRuleCheck?: boolean; // Skip recurring rule validation for recurring bookings
        createdByUserId?: Id<"users">; // The actual user who created the booking (for lastActionByUserId)
    }
) {
    // Validate tutor-student relationship
    await _validateTutorStudentRelationship(ctx, args.fromUserId, args.toUserId);

    // Check booking eligibility
    const eligibility = await _getBookingEligibilityQuery(ctx, {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
    });

    // Early return: active free booking exists
    if (eligibility.hasActiveFreeBooking) {
        throw new Error(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
    }

    // Determine booking type
    const bookingTypeValue = determineBookingType(args.bookingType, eligibility);

    // Validate timestamp (not in past, no time conflicts)
    await _validateBookingTimestamp(ctx, {
        timestamp: args.timestamp,
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        bookingType: bookingTypeValue,
        skipRecurringRuleCheck: args.skipRecurringRuleCheck, // Pass through the flag
    });

    // Create booking
    // Use createdByUserId for lastActionByUserId if provided, otherwise default to fromUserId
    const creatorId = args.createdByUserId ?? args.fromUserId;
    
    const bookingId = await ctx.db.insert("bookings", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        timestamp: args.timestamp,
        status: "pending",
        bookingType: bookingTypeValue,
        events: [],
        lastActionByUserId: creatorId,
        recurringRuleId: args.recurringRuleId, // Link to recurring rule if provided
    });

    // Add creation event with the actual creator
    await _addBookingEventMutation(ctx, bookingId, creatorId, "created", {
        scheduledTime: args.timestamp,
    });
}

/**
 * Determine booking type based on explicit type or eligibility
 * Extracted for readability and testability
 */
function determineBookingType(
    explicitType: BookingType | undefined,
    eligibility: {
        canCreateFreeBooking: boolean;
        canCreatePaidBooking: boolean;
        hasActiveFreeBooking: boolean;
    }
): BookingType {
    // Explicit type provided - validate it
    if (explicitType === "free") {
        if (!eligibility.canCreateFreeBooking) {
            throw new Error(
                "Cannot create a free booking. " +
                "You have already completed a free meeting with this user. " +
                "Only paid bookings are allowed."
            );
        }
        return "free";
    }

    if (explicitType === "paid") {
        if (!eligibility.canCreatePaidBooking) {
            throw new Error(
                "Cannot create a paid booking without completing a free meeting first. " +
                "The first booking must be a free introductory session."
            );
        }
        return "paid";
    }

    // Auto-determine based on eligibility
    if (eligibility.canCreateFreeBooking) {
        return "free";
    }

    if (eligibility.canCreatePaidBooking) {
        return "paid";
    }

    throw new Error("Unable to determine booking type. Please contact support.");
}

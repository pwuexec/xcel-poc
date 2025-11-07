import { MutationCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { BookingType } from "../../types/bookingType";
import { ACTIVE_STATUSES } from "../../types/bookingStatuses";
import { BOOKING_ERRORS } from "../../../constants/errors";
import { _validateTutorStudentRelationship } from "../_validateTutorStudentRelationship";
import { _addBookingEventMutation } from "./_addBookingEventMutation";
import { _getBookingEligibilityQuery } from "../queries/_getBookingEligibilityQuery";

export async function _createBookingMutation(
    ctx: MutationCtx,
    args: {
        fromUserId: Id<"users">;
        toUserId: Id<"users">;
        timestamp: number;
        bookingType?: BookingType; // Optional: allow explicit booking type specification
    }
) {
    await _validateTutorStudentRelationship(ctx, args.fromUserId, args.toUserId);

    // Use the efficient eligibility query helper
    const eligibility = await _getBookingEligibilityQuery(ctx, {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
    });

    // Check for active free meeting
    if (eligibility.hasActiveFreeBooking) {
        throw new Error(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
    }

    // Determine booking type
    let bookingTypeValue: BookingType;
    
    if (args.bookingType) {
        // Explicit booking type provided - validate it
        if (args.bookingType === "paid" && !eligibility.canCreatePaidBooking) {
            throw new Error("Cannot create a paid booking without a completed free meeting first");
        }
        
        if (args.bookingType === "free" && !eligibility.canCreateFreeBooking) {
            throw new Error("Cannot create another free booking at this time");
        }
        
        bookingTypeValue = args.bookingType;
    } else {
        // Auto-determine booking type based on eligibility
        if (eligibility.isFirstBooking || (!eligibility.hasCompletedFreeMeeting && eligibility.canCreateFreeBooking)) {
            bookingTypeValue = "free";
        } else if (eligibility.hasCompletedFreeMeeting) {
            bookingTypeValue = "paid";
        } else {
            throw new Error("Unable to determine booking type");
        }
    }

    const bookingId = await ctx.db.insert("bookings", {
        fromUserId: args.fromUserId,
        toUserId: args.toUserId,
        timestamp: args.timestamp,
        status: "pending",
        bookingType: bookingTypeValue,
        events: [],
        lastActionByUserId: args.fromUserId,
    });

    // Add creation event
    await _addBookingEventMutation(ctx, bookingId, args.fromUserId, "created", {
        scheduledTime: args.timestamp,
    });

    return bookingId;
}

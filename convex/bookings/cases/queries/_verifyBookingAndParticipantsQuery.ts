import { QueryCtx } from "../../../_generated/server";
import { Id } from "../../../_generated/dataModel";
import { getUserByIdOrThrow } from "../../../users/cases/queries/_getCurrentUserQuery";
import { _getBookingOrThrow } from "../_getBookingOrThrow";

/**
 * Business logic to verify a booking exists and that a user is a participant
 * 
 * This scenario:
 * - Validates the booking exists
 * - Verifies the user is either the tutor (toUserId) or student (fromUserId)
 * - Returns the booking data with full tutor and student information
 * 
 * Typically called by:
 * - LessonSpace integration to verify access before creating sessions
 * - Video call integrations to validate participants
 * - Any external service that needs to verify booking participation
 */
export async function _verifyBookingAndParticipantsQuery(
    ctx: QueryCtx,
    args: {
        bookingId: Id<"bookings">;
        userId: Id<"users">;
    }
) {
    // Get the booking or throw if not found
    const booking = await _getBookingOrThrow(ctx, args.bookingId);

    // Verify the user is a participant (either tutor or student)
    const isParticipant = 
        booking.toUserId === args.userId || 
        booking.fromUserId === args.userId;

    if (!isParticipant) {
        throw new Error(
            "Unauthorized: User is not a participant in this booking"
        );
    }

    // Get full user information for both participants
    const tutor = await getUserByIdOrThrow(ctx, booking.toUserId);
    const student = await getUserByIdOrThrow(ctx, booking.fromUserId);

    // Ensure required fields exist
    if (!tutor.name || !tutor.email) {
        throw new Error("Tutor is missing required information (name or email)");
    }
    if (!student.name || !student.email) {
        throw new Error("Student is missing required information (name or email)");
    }

    return {
        booking,
        tutor: {
            _id: tutor._id,
            name: tutor.name,
            email: tutor.email,
        },
        student: {
            _id: student._id,
            name: student.name,
            email: student.email,
        },
    };
}

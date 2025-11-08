"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";
import { EARLY_JOIN_MINUTES, LATE_JOIN_MINUTES } from "../constants";
const crypto = require('crypto');

type LessonspaceSessionResult = {
    launchUrl: string;
    spaceId: string;
    participants: {
        tutor: string;
        student: string;
    };
};

/**
 * Public action to create a Lessonspace session for a booking
 * 
 * This action:
 * 1. Verifies the booking exists and user is a participant
 * 2. Validates the lesson is within the allowed time window (10 min before to 1 hour after)
 * 3. Calls the Lessonspace API to create a personalized session URL for the user
 * 4. Returns the session details with launch URL unique to this user
 * 
 * Each user (tutor and student) gets their own unique URL with appropriate permissions.
 * Tutors are assigned as "leader" in the space.
 * 
 * Time window restrictions:
 * - Can join: Starting 10 minutes before the scheduled time
 * - Can join: Up to 1 hour after the scheduled start time
 * - Cannot join: Before 10 minutes prior or after 1 hour has passed
 * 
 * Uses constants from ../constants.ts:
 * - EARLY_JOIN_MINUTES: Minutes before session users can join
 * - LATE_JOIN_MINUTES: Minutes after session users can still join
 * 
 * Called directly from the frontend via Convex client libraries.
 * 
 * Architecture:
 * - **Space**: A persistent online classroom (identified by space ID)
 * - **Session**: The actual lesson time when users are connected
 * - **Launch URL**: Unique per-user URL with personalized permissions
 */
export const createLessonspaceSession = action({
    args: {
        bookingId: v.id("bookings"),
        userId: v.id("users"),
        userName: v.string(),
        userEmail: v.string(),
    },
    handler: async (ctx, args): Promise<LessonspaceSessionResult> => {
        // Verify booking exists and user is a participant
        const bookingData = await ctx.runQuery(
            internal.bookings.integrations.reads.verifyBookingAndParticipantsQuery,
            {
                bookingId: args.bookingId,
                userId: args.userId,
            }
        );

        // Validate that the lesson is within the allowed time window
        // Can join: EARLY_JOIN_MINUTES before start time until LATE_JOIN_MINUTES after start time
        const now = Date.now();
        const earlyJoinMs = EARLY_JOIN_MINUTES * 60 * 1000;
        const lateJoinMs = LATE_JOIN_MINUTES * 60 * 1000;
        const timeDifference = bookingData.booking.timestamp - now;

        // Too early - more than EARLY_JOIN_MINUTES before the lesson
        if (timeDifference > earlyJoinMs) {
            const minutesUntilStart = Math.ceil(timeDifference / (60 * 1000));
            const availableAt = bookingData.booking.timestamp - earlyJoinMs;
            
            throw new Error(
                JSON.stringify({
                    code: "LESSON_NOT_AVAILABLE",
                    message: `You can join the lesson starting ${EARLY_JOIN_MINUTES} minutes before the scheduled time. The lesson starts in ${minutesUntilStart} minutes.`,
                    availableAt,
                })
            );
        }

        // Too late - more than LATE_JOIN_MINUTES after the lesson started
        if (timeDifference < -lateJoinMs) {
            const hoursAfterStart = Math.abs(Math.floor(timeDifference / (60 * 60 * 1000)));
            
            throw new Error(
                JSON.stringify({
                    code: "LESSON_EXPIRED",
                    message: `This lesson session has expired. You can only join within ${LATE_JOIN_MINUTES} minutes after the scheduled start time. This lesson started ${hoursAfterStart} hour(s) ago.`,
                })
            );
        }

        // Call Lessonspace API to create session
        const lessonspaceApiKey = process.env.LESSONSPACE_API_KEY;
        if (!lessonspaceApiKey) {
            throw new Error("Missing Lessonspace API key");
        }

        // Use Web Crypto (native browser) to compute a SHA-256 hash for the space ID
        const spaceId = computeSpaceIdHash(bookingData.tutor._id, bookingData.student._id);
        const isTutor = bookingData.tutor._id === args.userId;

        try {
            const launchSpaceResponse = await fetch(
                `https://api.thelessonspace.com/v2/spaces/launch/`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Organisation ${lessonspaceApiKey}`,
                    },
                    body: JSON.stringify({
                        id: spaceId,
                        locale: "en",
                        user: {
                            id: args.userId,
                            name: args.userName,
                            role: isTutor ? "tutor" : "student",
                            email: args.userEmail,
                            leader: isTutor,
                        },
                        features: {
                            "import.zip": false,
                            "breakouts.enabled": false,
                            "options.profanityFilter": true,
                            "people.invite": false,
                        }
                    }),
                }
            );

            if (!launchSpaceResponse.ok) {
                const errorData = await launchSpaceResponse.text();
                console.error("Lessonspace launch error:", errorData);
                throw new Error(`Failed to launch space: ${launchSpaceResponse.status}`);
            }

            const launchData = await launchSpaceResponse.json();

            return {
                launchUrl: launchData.client_url,
                spaceId: spaceId,
                participants: {
                    tutor: bookingData.tutor.name,
                    student: bookingData.student.name,
                },
            };
        } catch (error) {
            console.error("Lessonspace session creation error:", error);
            throw error;
        }
    },
});

function computeSpaceIdHash(tutorId: string, studentId: string) {
    const data = `${tutorId}-${studentId}`;
    const hash = crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);

    return hash;
}
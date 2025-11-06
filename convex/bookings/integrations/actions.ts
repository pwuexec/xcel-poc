"use node";

import { v } from "convex/values";
import { action } from "../../_generated/server";
import { internal } from "../../_generated/api";

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
 * 2. Validates the lesson is within 10 minutes of start time
 * 3. Calls the Lessonspace API to create a session
 * 4. Returns the session details with launch URL
 * 
 * Can be called from:
 * - Frontend via Convex client libraries
 * - HTTP endpoint (via cases/httpActions/lessonspace.ts)
 * 
 * Architecture:
 * - **Space**: A persistent online classroom (identified by space ID)
 * - **Session**: The actual lesson time when users are connected
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

        // Validate that the lesson is within 10 minutes of start time
        const now = Date.now();
        const tenMinutesInMs = 10 * 60 * 1000;
        const timeDifference = bookingData.booking.timestamp - now;

        if (timeDifference > tenMinutesInMs) {
            const minutesUntilStart = Math.ceil(timeDifference / (60 * 1000));
            const availableAt = bookingData.booking.timestamp - tenMinutesInMs;
            
            throw new Error(
                JSON.stringify({
                    code: "LESSON_NOT_AVAILABLE",
                    message: `You can join the lesson starting 10 minutes before the scheduled time. The lesson starts in ${minutesUntilStart} minutes.`,
                    availableAt,
                })
            );
        }

        // Call Lessonspace API to create session
        const lessonspaceApiKey = process.env.LESSONSPACE_API_KEY;

        if (!lessonspaceApiKey) {
            throw new Error("Missing Lessonspace API key");
        }

        const spaceId = btoa(`${bookingData.tutor._id}-${bookingData.student._id}`).substring(0, 63);
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

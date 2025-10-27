import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { features } from "process";

/** ---------- CORS helpers ---------- */
function corsHeaders(origin: string | null) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "origin",
    };
}

export const handleLessonspaceOptions = httpAction(async (_, req) => {
    const origin = req.headers.get("Origin");
    return new Response(null, {
        status: 204,
        headers: new Headers(corsHeaders(origin)),
    });
});

/** ---------- Public action: POST /lessonspace-session ---------- */
/**
 * Creates a Lessonspace session for a booking
 * 
 * Lessonspace Architecture:
 * - **Space**: A persistent online classroom (identified by space ID)
 * - **Session**: The actual lesson time when users are connected
 * 
 * Flow:
 * 1. Call /v2/spaces/launch/ with space ID (booking-{bookingId}) and username
 * 2. Lessonspace creates the space if it doesn't exist, or reuses existing space
 * 3. Returns a unique launch URL for the user to join
 * 4. Session starts when first user joins, ends 30s after last user leaves
 * 
 * Important Notes:
 * - Spaces are persistent - all content (whiteboard, docs) is saved
 * - Sessions auto-terminate after 5 min of all users being idle
 * - Each browser tab counts as a separate connection (affects billing)
 * - The space ID pattern is: booking-{bookingId}
 */
export const createLessonspaceSession = httpAction(async (_ctx, req) => {
    const origin = req.headers.get("Origin");
    const headers = {
        "Content-Type": "application/json",
        ...corsHeaders(origin),
    };

    try {
        const { bookingId, userId, userName, userEmail } = await req.json();

        if (!bookingId || !userId || !userName || !userEmail) {
            return new Response(
                JSON.stringify({
                    error: "bookingId, userId, userName, and userEmail are required",
                }),
                {
                    status: 400,
                    headers,
                }
            );
        }

        // Verify booking exists and user is a participant
        let bookingData;
        try {
            bookingData = await _ctx.runQuery(internal.schemas.bookings.verifyBookingAndParticipants, {
                bookingId: bookingId as Id<"bookings">,
                userId: userId as Id<"users">,
            });
        } catch (error) {
            return new Response(
                JSON.stringify({
                    error: error instanceof Error ? error.message : "Unauthorized access to booking",
                }),
                {
                    status: 403,
                    headers,
                }
            );
        }

        const lessonspaceApiKey = process.env.LESSONSPACE_API_KEY;

        if (!lessonspaceApiKey) {
            return new Response(
                JSON.stringify({ error: "Missing Lessonspace API key" }),
                {
                    status: 500,
                    headers,
                }
            );
        }

        // Launch the space directly using the booking ID as the space ID
        // This creates/reuses the space and generates a launch URL in one call
        // The space ID is the unique identifier - using bookingId ensures each booking has its own space
        const spaceId = btoa(`${bookingData.tutor._id}-${bookingData.student._id}`).substring(0, 63);
        console.log(spaceId.length)
        // Determine if the current user is the tutor (leader)
        const isTutor = bookingData.tutor._id === userId;

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
                        id: userId,
                        name: userName,
                        role: isTutor ? "tutor" : "student",
                        email: userEmail,
                        ...(isTutor && { leader: true }), // Add leader flag only for tutors
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

        // Record video call started in the booking
        await _ctx.runMutation(internal.schemas.bookings.recordVideoCallStarted, {
            bookingId: bookingId as Id<"bookings">,
        });

        return new Response(
            JSON.stringify({
                launchUrl: launchData.client_url, // Use client_url from Lessonspace response
                spaceId: spaceId,
                participants: {
                    tutor: bookingData.tutor.name,
                    student: bookingData.student.name,
                },
            }),
            { status: 200, headers }
        );
    } catch (e) {
        console.error("Lessonspace session creation error:", e);
        return new Response(
            JSON.stringify({
                error: "Failed to create Lessonspace session",
                details: e instanceof Error ? e.message : "Unknown error",
            }),
            {
                status: 500,
                headers,
            }
        );
    }
});

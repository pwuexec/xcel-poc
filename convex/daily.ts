import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";

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

export const handleDailyRoomOptions = httpAction(async (_, req) => {
    const origin = req.headers.get("Origin");
    return new Response(null, {
        status: 204,
        headers: new Headers(corsHeaders(origin)),
    });
});

/** ---------- Public action: POST /daily-room ---------- */
/**
 * Creates a Daily.co video call room for a booking
 * 
 * The room is associated with a booking ID and can be accessed by:
 * 1. Video call participants via Daily.co
 * 2. Whiteboard collaboration via /whiteboard?booking={bookingId}
 * 
 * Both the video call and whiteboard use the same bookingId to ensure
 * participants in the video call can collaborate on the same whiteboard.
 */
export const createDailyRoom = httpAction(async (_ctx, req) => {
    const origin = req.headers.get("Origin");
    const headers = {
        "Content-Type": "application/json",
        ...corsHeaders(origin),
    };

    try {
        const { bookingId, userId, userName } = await req.json();

        if (!bookingId || !userId || !userName) {
            return new Response(
                JSON.stringify({
                    error: "bookingId, userId, and userName are required",
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

        const dailyApiKey = process.env.DAILY_API_KEY;
        if (!dailyApiKey) {
            return new Response(
                JSON.stringify({ error: "Missing DAILY_API_KEY" }),
                {
                    status: 500,
                    headers,
                }
            );
        }

        // Create a Daily.co room with booking participants info
        const roomName = `booking-${bookingId}`;
        const createRoomResponse = await fetch("https://api.daily.co/v1/rooms", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${dailyApiKey}`,
            },
            body: JSON.stringify({
                name: roomName,
                privacy: "private",
                properties: {
                    enable_screenshare: true,
                    enable_chat: true,
                    enable_knocking: false,
                    enable_prejoin_ui: false,
                    start_video_off: false,
                    start_audio_off: false,
                    exp: Math.floor(Date.now() / 1000) + 60 * 55, // 55 minutes
                    // Store booking metadata
                    enable_recording: "cloud",
                    owner_only_broadcast: false,
                },
            }),
        });

        let roomUrl: string;
        if (createRoomResponse.status === 200) {
            const roomData = await createRoomResponse.json();
            roomUrl = roomData.url;
        } else if (createRoomResponse.status === 400) {
            // Room might already exist
            const getRoomResponse = await fetch(
                `https://api.daily.co/v1/rooms/${roomName}`,
                {
                    headers: {
                        Authorization: `Bearer ${dailyApiKey}`,
                    },
                }
            );

            if (!getRoomResponse.ok) {
                throw new Error(`Failed to get existing room: ${getRoomResponse.status}`);
            }

            const roomData = await getRoomResponse.json();
            roomUrl = roomData.url;
        } else {
            throw new Error(`Failed to create room: ${createRoomResponse.status}`);
        }

        // Create a meeting token for the user
        const tokenResponse = await fetch(
            "https://api.daily.co/v1/meeting-tokens",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${dailyApiKey}`,
                },
                body: JSON.stringify({
                    properties: {
                        room_name: roomName,
                        user_name: userName,
                        user_id: userId,
                        is_owner: true,
                        enable_screenshare: true,
                        start_video_off: false,
                        start_audio_off: false,
                        exp: Math.floor(Date.now() / 1000) + 60 * 55, // 55 minutes
                    },
                }),
            }
        );

        if (!tokenResponse.ok) {
            throw new Error(`Failed to create token: ${tokenResponse.status}`);
        }

        const { token } = await tokenResponse.json();

        // Record video call started in the booking
        await _ctx.runMutation(internal.schemas.bookings.recordVideoCallStarted, {
            bookingId: bookingId as Id<"bookings">,
        });

        return new Response(
            JSON.stringify({
                roomUrl,
                token,
                participants: {
                    tutor: bookingData.tutor.name,
                    student: bookingData.student.name,
                },
            }),
            { status: 200, headers }
        );
    } catch (e) {
        console.error("Daily.co room creation error:", e);
        return new Response(
            JSON.stringify({
                error: "Failed to create room",
                details: e instanceof Error ? e.message : "Unknown error",
            }),
            {
                status: 500,
                headers,
            }
        );
    }
});

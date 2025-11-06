import { httpAction } from "../../_generated/server";
import { api } from "../../_generated/api";
import { Id } from "../../_generated/dataModel";

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

/**
 * Handle OPTIONS preflight requests for CORS
 */
export const handleLessonspaceOptions = httpAction(async (_, req) => {
    const origin = req.headers.get("Origin");
    return new Response(null, {
        status: 204,
        headers: new Headers(corsHeaders(origin)),
    });
});

/**
 * HTTP endpoint for creating a Lessonspace session
 * 
 * This is a thin HTTP wrapper that:
 * 1. Handles CORS headers
 * 2. Parses and validates the HTTP request
 * 3. Delegates to the action for business logic
 * 4. Formats the response
 * 
 * The actual business logic lives in:
 * - integrations/actions.ts (entry point)
 * - cases/actions/_createLessonspaceSessionAction.ts (core logic)
 */
export const createLessonspaceSession = httpAction(async (ctx, req) => {
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

        // Delegate to the action for business logic
        const sessionResult = await ctx.runAction(
            api.bookings.integrations.actions.createLessonspaceSession,
            {
                bookingId: bookingId as Id<"bookings">,
                userId: userId as Id<"users">,
                userName,
                userEmail,
            }
        );

        return new Response(
            JSON.stringify(sessionResult),
            { status: 200, headers }
        );
    } catch (e) {
        console.error("Lessonspace session creation error:", e);
        
        // Try to parse structured errors from the action
        let errorMessage = "Failed to create Lessonspace session";
        let errorDetails = e instanceof Error ? e.message : "Unknown error";
        let status = 500;
        
        try {
            const parsedError = JSON.parse(errorDetails);
            if (parsedError.code === "LESSON_NOT_AVAILABLE") {
                return new Response(
                    JSON.stringify({
                        error: "Lesson session not yet available",
                        message: parsedError.message,
                        availableAt: parsedError.availableAt,
                    }),
                    {
                        status: 403,
                        headers,
                    }
                );
            }
        } catch {
            // Not a structured error, continue with default handling
        }

        return new Response(
            JSON.stringify({
                error: errorMessage,
                details: errorDetails,
            }),
            {
                status,
                headers,
            }
        );
    }
});

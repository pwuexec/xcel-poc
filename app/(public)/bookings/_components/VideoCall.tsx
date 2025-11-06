"use client";

/**
 * Lessonspace Video Call Utility
 * 
 * Function to get a Lessonspace session URL for a booking.
 */

interface GetVideoCallUrlParams {
    bookingId: string;
    userName: string;
    userId: string;
    userEmail: string;
}

export async function getVideoCallUrl({ bookingId, userName, userId, userEmail }: GetVideoCallUrlParams): Promise<string> {
    try {
        // Fetch Lessonspace session from backend
        const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL?.replace("cloud", "site");
        if (!convexUrl) {
            throw new Error("Convex URL not configured");
        }

        const response = await fetch(`${convexUrl}/lessonspace-session`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ bookingId, userId, userName, userEmail }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));
            throw new Error(errorData.error || `Failed to create session: ${response.status}`);
        }

        const { launchUrl } = await response.json();
        return launchUrl;
    } catch (error) {
        console.error("Failed to get video call URL:", error);
        throw error;
    }
}

// Legacy component export for backward compatibility
export default function VideoCall() {
    return null;
}



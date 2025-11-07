"use client";

import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";

/**
 * Hook to get a Lessonspace session URL for a booking.
 * Each user gets their own personalized URL with appropriate permissions.
 */
export function useVideoCall() {
    const createSession = useAction(api.bookings.integrations.actions.createLessonspaceSession);

    const getVideoCallUrl = async ({ 
        bookingId, 
        userName, 
        userId, 
        userEmail 
    }: {
        bookingId: Id<"bookings">;
        userName: string;
        userId: Id<"users">;
        userEmail: string;
    }) => {
        try {
            const result = await createSession({
                bookingId,
                userId,
                userName,
                userEmail,
            });
            return result.launchUrl;
        } catch (error) {
            console.error("Failed to get video call URL:", error);
            throw error;
        }
    };

    return { getVideoCallUrl };
}




/**
 * Shared UI helpers for booking components
 * Reduces code duplication across booking card sub-components
 */

/**
 * Get user avatar element (image or initials)
 */
export function getUserAvatarProps(name: string, image?: string) {
    if (image) {
        return {
            type: 'image' as const,
            src: image,
            alt: name,
        };
    }
    
    return {
        type: 'initials' as const,
        initials: name[0]?.toUpperCase() || "?",
    };
}

/**
 * Get user role label
 */
export function getUserRoleLabel(role: "tutor" | "student"): string {
    return role === "tutor" ? "Student" : "Your Tutor";
}

/**
 * Calculate if a booking allows video call access
 * Video calls available: 10 minutes before to 1 hour after booking time
 */
export function canJoinVideoCall(status: string, timestamp: number): boolean {
    if (status !== "confirmed") return false;
    
    const now = Date.now();
    const tenMinutes = 10 * 60 * 1000;
    const oneHour = 60 * 60 * 1000;
    const timeDiff = timestamp - now;
    
    return timeDiff <= tenMinutes && timeDiff > -oneHour;
}

/**
 * Check if booking is in a final state (cannot be modified)
 */
export function isBookingFinal(status: string): boolean {
    return ["completed", "canceled", "rejected"].includes(status);
}

/**
 * Check if user can accept/reject booking
 */
export function canRespondToBooking(status: string, userMadeLastAction: boolean): boolean {
    return (status === "pending" || status === "awaiting_reschedule") && !userMadeLastAction;
}

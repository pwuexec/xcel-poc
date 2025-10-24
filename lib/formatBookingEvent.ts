// Utility to format booking events with typed metadata

type EventMetadata =
    | { scheduledTime: number }
    | { wasReschedule: boolean; acceptedTime?: number }
    | { wasReschedule: boolean }
    | { oldTime: number; newTime: number; proposedBy: "tutor" | "student" }
    | { reason?: string }
    | { completedAt: number };

export interface BookingEventData {
    timestamp: number;
    userName: string;
    type: "created" | "accepted" | "rejected" | "rescheduled" | "canceled" | "completed";
    metadata: EventMetadata;
}

// Helper to format UTC timestamps to local time strings
function formatUTCTime(utcTimestamp: number): string {
    const date = new Date(utcTimestamp);
    return date.toLocaleString(undefined, {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZoneName: 'short'
    });
}

export function formatBookingEvent(event: BookingEventData): string {
    switch (event.type) {
        case "created": {
            const meta = event.metadata as { scheduledTime: number };
            return `Booking created for ${formatUTCTime(meta.scheduledTime)}`;
        }

        case "accepted": {
            const meta = event.metadata as { wasReschedule: boolean; acceptedTime?: number };
            if (meta.wasReschedule && meta.acceptedTime) {
                return `Accepted rescheduled time: ${formatUTCTime(meta.acceptedTime)}`;
            }
            return `${event.userName} accepted booking`;
        }

        case "rejected": {
            const meta = event.metadata as { wasReschedule: boolean };
            if (meta.wasReschedule) {
                return `${event.userName} rejected rescheduled time`;
            }
            return `${event.userName} rejected booking`;
        }

        case "rescheduled": {
            const meta = event.metadata as { oldTime: number; newTime: number; proposedBy: "tutor" | "student" };
            const proposer = meta.proposedBy === "tutor" ? "Tutor" : "Student";
            const confirmer = meta.proposedBy === "tutor" ? "student" : "tutor";
            return `${proposer} ${event.userName} requested reschedule from ${formatUTCTime(meta.oldTime)} to ${formatUTCTime(meta.newTime)}. Awaiting ${confirmer} confirmation.`;
        }

        case "canceled": {
            const meta = event.metadata as { reason?: string };
            return meta.reason ? `Booking canceled: ${meta.reason}` : "Booking canceled";
        }

        case "completed": {
            const meta = event.metadata as { completedAt: number };
            return `Booking completed at ${formatUTCTime(meta.completedAt)}`;
        }

        default:
            return "Unknown event";
    }
}

export function getEventIcon(eventType: BookingEventData["type"]): string {
    switch (eventType) {
        case "created":
            return "📝";
        case "accepted":
            return "✅";
        case "rejected":
            return "❌";
        case "rescheduled":
            return "📅";
        case "canceled":
            return "🚫";
        case "completed":
            return "✔️";
        default:
            return "•";
    }
}

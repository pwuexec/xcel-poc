// Utility to format booking events with typed metadata
import { Infer } from "convex/values";
import {
    bookingEvent,
    bookingCreatedEventMetadata,
    bookingAcceptedEventMetadata,
    bookingRejectedEventMetadata,
    bookingRescheduledEventMetadata,
    bookingCanceledEventMetadata,
    bookingCompletedEventMetadata,
    bookingPaymentInitiatedEventMetadata,
    bookingPaymentSucceededEventMetadata,
    bookingPaymentFailedEventMetadata,
    bookingPaymentRefundedEventMetadata,
} from "@/convex/bookings";

// Infer types from validators
type BookingEvent = Infer<typeof bookingEvent>;
type BookingCreatedMetadata = Infer<typeof bookingCreatedEventMetadata>;
type BookingAcceptedMetadata = Infer<typeof bookingAcceptedEventMetadata>;
type BookingRejectedMetadata = Infer<typeof bookingRejectedEventMetadata>;
type BookingRescheduledMetadata = Infer<typeof bookingRescheduledEventMetadata>;
type BookingCanceledMetadata = Infer<typeof bookingCanceledEventMetadata>;
type BookingCompletedMetadata = Infer<typeof bookingCompletedEventMetadata>;
type BookingPaymentInitiatedMetadata = Infer<typeof bookingPaymentInitiatedEventMetadata>;
type BookingPaymentSucceededMetadata = Infer<typeof bookingPaymentSucceededEventMetadata>;
type BookingPaymentFailedMetadata = Infer<typeof bookingPaymentFailedEventMetadata>;
type BookingPaymentRefundedMetadata = Infer<typeof bookingPaymentRefundedEventMetadata>;

export interface BookingEventData extends Omit<BookingEvent, 'userId'> {
    userName: string; // Resolved user name instead of userId
}

// Helper to format UTC timestamps to UK local time strings
function formatUTCTime(utcTimestamp: number): string {
    const date = new Date(utcTimestamp);
    return date.toLocaleString('en-GB', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Europe/London',
        timeZoneName: 'short'
    });
}

// Helper to format currency amounts in GBP
function formatCurrency(amount: number, currency: string = 'gbp'): string {
    return new Intl.NumberFormat('en-GB', {
        style: 'currency',
        currency: currency.toUpperCase(),
    }).format(amount / 100); // Convert pence to pounds
}

export function formatBookingEvent(event: BookingEventData): string {
    switch (event.type) {
        case "created": {
            const meta = event.metadata as BookingCreatedMetadata;
            return `Booking created for ${formatUTCTime(meta.scheduledTime)}`;
        }

        case "accepted": {
            const meta = event.metadata as BookingAcceptedMetadata;
            if (meta.wasReschedule && meta.acceptedTime) {
                return `Accepted rescheduled time: ${formatUTCTime(meta.acceptedTime)}`;
            }
            return `${event.userName} accepted booking`;
        }

        case "rejected": {
            const meta = event.metadata as BookingRejectedMetadata;
            if (meta.wasReschedule) {
                return `${event.userName} rejected rescheduled time`;
            }
            return `${event.userName} rejected booking`;
        }

        case "rescheduled": {
            const meta = event.metadata as BookingRescheduledMetadata;
            const proposer = meta.proposedBy === "tutor" ? "Tutor" : "Student";
            const confirmer = meta.proposedBy === "tutor" ? "student" : "tutor";
            return `${proposer} ${event.userName} requested reschedule from ${formatUTCTime(meta.oldTime)} to ${formatUTCTime(meta.newTime)}. Awaiting ${confirmer} confirmation.`;
        }

        case "canceled": {
            const meta = event.metadata as BookingCanceledMetadata;
            return meta.reason ? `Booking canceled: ${meta.reason}` : "Booking canceled";
        }

        case "completed": {
            const meta = event.metadata as BookingCompletedMetadata;
            return `Booking completed at ${formatUTCTime(meta.completedAt)}`;
        }

        case "payment_initiated": {
            const meta = event.metadata as BookingPaymentInitiatedMetadata;
            return `Payment initiated: ${formatCurrency(meta.amount, meta.currency)}`;
        }

        case "payment_succeeded": {
            const meta = event.metadata as BookingPaymentSucceededMetadata;
            return `Payment successful: ${formatCurrency(meta.amount, meta.currency)}`;
        }

        case "payment_failed": {
            const meta = event.metadata as BookingPaymentFailedMetadata;
            return meta.reason ? `Payment failed: ${meta.reason}` : "Payment failed";
        }

        case "payment_refunded": {
            const meta = event.metadata as BookingPaymentRefundedMetadata;
            return `Payment refunded: ${formatCurrency(meta.amount, meta.currency)}`;
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
        case "payment_initiated":
            return "💳";
        case "payment_succeeded":
            return "💰";
        case "payment_failed":
            return "⚠️";
        case "payment_refunded":
            return "↩️";
        default:
            return "•";
    }
}

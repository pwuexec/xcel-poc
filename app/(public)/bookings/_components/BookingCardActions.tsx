"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
    VideoIcon,
    CreditCardIcon,
    CheckIcon,
    XIcon,
    CalendarClockIcon,
    BanIcon,
    RepeatIcon,
} from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";
import { canJoinVideoCall, canRespondToBooking, isBookingFinal, canCreateRecurringBooking } from "./bookingHelpers";

interface BookingCardActionsProps {
    bookingId: Id<"bookings">;
    bookingType: "free" | "paid";
    status: string;
    timestamp: number;
    currentUserRole: "tutor" | "student" | "user" | "admin";
    lastActionByCurrentUser: boolean;
    isPaid: boolean;
    tutorId: Id<"users">;
    tutorName: string;
    onAccept: () => Promise<void>;
    onReject: () => Promise<void>;
    onCancel: () => Promise<void>;
    onPayment: () => void;
    onJoinVideoCall: () => Promise<void>;
    onCreateRecurring: () => void;
}

export function BookingCardActions({
    bookingId,
    bookingType,
    status,
    timestamp,
    currentUserRole,
    lastActionByCurrentUser,
    isPaid,
    tutorId,
    tutorName,
    onAccept,
    onReject,
    onCancel,
    onPayment,
    onJoinVideoCall,
    onCreateRecurring,
}: BookingCardActionsProps) {
    const [isJoiningCall, setIsJoiningCall] = useState(false);

    // Determine available actions using helpers
    const canAcceptReject = canRespondToBooking(status, lastActionByCurrentUser);
    const canReschedule = !isBookingFinal(status);
    const canCancelBooking = !isBookingFinal(status);
    const canPay = status === "awaiting_payment" && currentUserRole === "student" && !isPaid && bookingType === "paid";
    const showJoinCall = canJoinVideoCall(status, timestamp);
    const showCreateRecurring = canCreateRecurringBooking(status, currentUserRole);

    const handleJoinVideoCall = async () => {
        setIsJoiningCall(true);
        try {
            await onJoinVideoCall();
        } finally {
            setIsJoiningCall(false);
        }
    };

    // Build action buttons configuration
    const actions = [
        {
            show: showJoinCall,
            key: "join-call",
            element: (
                <Button
                    onClick={handleJoinVideoCall}
                    disabled={isJoiningCall}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50 w-full"
                    size="lg"
                >
                    <VideoIcon className="size-5" />
                    {isJoiningCall ? "Launching..." : "Join Video Call"}
                </Button>
            ),
        },
        {
            show: canPay,
            key: "payment",
            element: (
                <Button
                    onClick={onPayment}
                    className="gap-2 bg-purple-600 hover:bg-purple-700 text-white w-full"
                    size="lg"
                >
                    <CreditCardIcon className="size-5" />
                    Complete Payment
                </Button>
            ),
        },
        {
            show: canAcceptReject,
            key: "accept",
            element: (
                <Button
                    onClick={onAccept}
                    className="gap-2 bg-green-600 hover:bg-green-700 text-white w-full"
                    size="lg"
                >
                    <CheckIcon className="size-5" />
                    Accept
                </Button>
            ),
        },
        {
            show: canAcceptReject,
            key: "decline",
            element: (
                <Button
                    onClick={onReject}
                    variant="outline"
                    className="gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 border-red-200 dark:border-red-900 w-full"
                    size="lg"
                >
                    <XIcon className="size-5" />
                    Decline
                </Button>
            ),
        },
        {
            show: showCreateRecurring,
            key: "create-recurring",
            element: (
                <Button
                    onClick={onCreateRecurring}
                    className="gap-2 bg-blue-600 hover:bg-blue-700 text-white w-full"
                    size="lg"
                >
                    <RepeatIcon className="size-5" />
                    Create Recurring Booking
                </Button>
            ),
        },
        {
            show: canReschedule && !showJoinCall && !showCreateRecurring,
            key: "reschedule",
            element: (
                <Button asChild variant="outline" className="gap-2 w-full" size="lg">
                    <Link href={`/bookings/reschedule?id=${bookingId}`}>
                        <CalendarClockIcon className="size-5" />
                        Reschedule
                    </Link>
                </Button>
            ),
        },
        {
            show: canCancelBooking && !showJoinCall && !canAcceptReject && !showCreateRecurring,
            key: "cancel",
            element: (
                <Button
                    onClick={onCancel}
                    variant="outline"
                    className="gap-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950 border-red-200 dark:border-red-900 w-full"
                    size="lg"
                >
                    <BanIcon className="size-5" />
                    Cancel
                </Button>
            ),
        },
    ];

    const visibleActions = actions.filter(action => action.show);

    if (visibleActions.length === 0) {
        return null;
    }

    return (
        <div className="flex gap-2">
            {visibleActions.map(action => (
                <div key={action.key} className="flex-1">
                    {action.element}
                </div>
            ))}
        </div>
    );
}

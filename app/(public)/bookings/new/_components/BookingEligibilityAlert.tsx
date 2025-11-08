"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircleIcon, CheckCircleIcon, InfoIcon } from "lucide-react";

interface BookingEligibilityAlertProps {
    canCreateFreeBooking: boolean;
    canCreatePaidBooking: boolean;
    hasActiveFreeBooking: boolean;
}

export function BookingEligibilityAlert({
    canCreateFreeBooking,
    canCreatePaidBooking,
    hasActiveFreeBooking,
}: BookingEligibilityAlertProps) {
    // Active free booking exists
    if (hasActiveFreeBooking) {
        return (
            <Alert variant="destructive">
                <AlertCircleIcon className="size-4" />
                <AlertDescription>
                    You already have an ongoing free trial session with this user. Please complete or cancel it before booking another session.
                </AlertDescription>
            </Alert>
        );
    }

    // Can only create paid bookings (free trial completed)
    if (!canCreateFreeBooking && canCreatePaidBooking) {
        return (
            <Alert className="border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/20">
                <InfoIcon className="size-4 text-blue-600 dark:text-blue-400" />
                <AlertDescription className="text-blue-900 dark:text-blue-100">
                    You've completed your free trial with this user. Only paid sessions are available now.
                </AlertDescription>
            </Alert>
        );
    }

    // Can only create free bookings (first booking or rebook after cancel/reject)
    if (canCreateFreeBooking && !canCreatePaidBooking) {
        return (
            <Alert className="border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/20">
                <CheckCircleIcon className="size-4 text-green-600 dark:text-green-400" />
                <AlertDescription className="text-green-900 dark:text-green-100">
                    First session must be a free trial. You can book paid sessions after completing the free trial.
                </AlertDescription>
            </Alert>
        );
    }

    return null;
}

"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { CheckCircle2Icon, AlertCircleIcon } from "lucide-react";
import { BOOKING_ERRORS } from "@/convex/constants/errors";

interface BookingEligibility {
    canCreateFreeBooking: boolean;
    canCreatePaidBooking: boolean;
    hasActiveFreeBooking: boolean;
}

interface BookingTypeDisplayProps {
    eligibility: BookingEligibility | undefined;
    isTutor: boolean;
}

export function BookingTypeDisplay({ eligibility, isTutor }: BookingTypeDisplayProps) {
    if (!eligibility) return null;

    return (
        <div className="space-y-2">
            <Label>Booking Type</Label>
            {eligibility.canCreateFreeBooking && !eligibility.canCreatePaidBooking && (
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-blue-600 text-white">Free Meeting</Badge>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            Free introductory session
                        </span>
                    </div>
                </div>
            )}
            {!eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking && (
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-2">
                        <Badge className="bg-purple-600 text-white">Paid Session</Badge>
                        <span className="text-sm text-zinc-700 dark:text-zinc-300">
                            Paid tutoring session
                        </span>
                    </div>
                    <Alert className="mt-2">
                        <CheckCircle2Icon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            You've completed your free meeting with this {isTutor ? "student" : "tutor"}. 
                            All new bookings will be paid sessions.
                        </AlertDescription>
                    </Alert>
                </div>
            )}
            {eligibility.hasActiveFreeBooking && (
                <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                        {BOOKING_ERRORS.FREE_MEETING_ACTIVE}
                    </AlertDescription>
                </Alert>
            )}
        </div>
    );
}

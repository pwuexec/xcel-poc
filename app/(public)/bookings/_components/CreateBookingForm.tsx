"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { BOOKING_ERRORS } from "@/convex/constants/errors";
import { CheckCircle2Icon, PopcornIcon, AlertCircleIcon, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CreateBookingFormProps {
    onSuccess?: () => void;
}

export default function CreateBookingForm({ onSuccess }: CreateBookingFormProps) {
    const [toUserId, setToUserId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [bookingType, setBookingType] = useState<"free" | "paid" | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBooking = useMutation(api.bookings.integrations.writes.createBookingMutation);
    const allUsers = useQuery(api.users.integrations.reads.getAllUsers);
    const currentUser = useQuery(api.users.integrations.reads.getMe);
    
    // Get booking eligibility for selected user
    const eligibility = useQuery(
        api.bookings.integrations.reads.getBookingEligibility,
        toUserId ? { otherUserId: toUserId as Id<"users"> } : "skip"
    );

    // Determine if current user is a tutor
    const isTutor = currentUser?.role === "tutor";
    const selectLabel = isTutor ? "Select Student" : "Select Tutor";
    const selectPlaceholder = isTutor ? "Select a student..." : "Select a tutor...";

    // Auto-set booking type based on eligibility
    useEffect(() => {
        if (eligibility) {
            if (eligibility.canCreateFreeBooking && !eligibility.canCreatePaidBooking) {
                setBookingType("free");
            } else if (!eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                setBookingType("paid");
            } else if (eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking) {
                // Both available, let user choose (default to free)
                if (!bookingType) {
                    setBookingType("free");
                }
            } else {
                setBookingType(null);
            }
        }
    }, [eligibility]);

    // Reset booking type when user changes
    useEffect(() => {
        setBookingType(null);
    }, [toUserId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!toUserId || !date || !time) {
            setError("Please fill in all fields");
            return;
        }

        if (!bookingType) {
            setError("Please select a booking type");
            return;
        }

        setIsSubmitting(true);
        try {
            // Parse date and time as UK timezone (Europe/London)
            // The input gives us local time, which for UK users is already in UK timezone
            const timestamp = new Date(`${date}T${time}`).getTime();
            await createBooking({
                toUserId: toUserId as Id<"users">,
                timestamp,
                bookingType,
            });

            // Reset form
            setToUserId("");
            setDate("");
            setTime("");
            setBookingType(null);

            // Call onSuccess first to close dialog
            onSuccess?.();
        } catch (error) {
            console.error(error);
            if (error instanceof Error) {
                if (error.message.includes(BOOKING_ERRORS.FREE_MEETING_ACTIVE)) {
                    setError(BOOKING_ERRORS.FREE_MEETING_ACTIVE);
                    return;
                }
            }

            setError(error instanceof Error ? error.message : "Failed to create booking");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
            <div className="grid w-full max-w-xl items-start gap-4">
                <Alert variant="destructive">
                    <AlertTitle>Error</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                </div>
            )}

            <div className="space-y-2">
                <Label htmlFor="toUserId">{selectLabel}</Label>
                <Select value={toUserId} onValueChange={setToUserId}>
                    <SelectTrigger>
                        <SelectValue placeholder={selectPlaceholder} />
                    </SelectTrigger>
                    <SelectContent>
                        {allUsers?.map((user) => (
                            <SelectItem key={user._id} value={user._id}>
                                {user.name || user.email || "Unknown User"}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            {/* Show booking type info/selector */}
            {eligibility && toUserId && (
                <div className="space-y-2">
                    <Label>Booking Type</Label>
                    {eligibility.canCreateFreeBooking && eligibility.canCreatePaidBooking && (
                        <>
                            <Select 
                                value={bookingType || ""} 
                                onValueChange={(value) => setBookingType(value as "free" | "paid")}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Select booking type..." />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="free">
                                        Free Meeting (Introductory)
                                    </SelectItem>
                                    <SelectItem value="paid">
                                        Paid Session
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                            <Alert>
                                <InfoIcon className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    You've completed a free meeting with this {isTutor ? "student" : "tutor"}. 
                                    You can book another free meeting or start paid sessions.
                                </AlertDescription>
                            </Alert>
                        </>
                    )}
                    {eligibility.canCreateFreeBooking && !eligibility.canCreatePaidBooking && (
                        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                            <div className="flex items-center gap-2">
                                <Badge className="bg-blue-600 text-white">Free Meeting</Badge>
                                <span className="text-sm text-zinc-700 dark:text-zinc-300">
                                    {eligibility.isFirstBooking 
                                        ? "First booking with this " + (isTutor ? "student" : "tutor")
                                        : "Free introductory session"
                                    }
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
                                <InfoIcon className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    You've completed a free meeting with this {isTutor ? "student" : "tutor"}. 
                                    New bookings will be paid sessions.
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
            )}

            <div className="space-y-2">
                <Label htmlFor="date">Date (UK Time)</Label>
                <Input
                    id="date"
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    required
                />
            </div>

            <div className="space-y-2">
                <Label htmlFor="time">Time (UK Time)</Label>
                <Input
                    id="time"
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    required
                />
            </div>

            <div className="flex gap-3 pt-4">
                <Button
                    type="submit"
                    className="w-full"
                    disabled={isSubmitting || !bookingType || (eligibility && eligibility.hasActiveFreeBooking)}
                >
                    {isSubmitting ? "Creating..." : "Create Booking"}
                </Button>
            </div>
        </form>
    );
}

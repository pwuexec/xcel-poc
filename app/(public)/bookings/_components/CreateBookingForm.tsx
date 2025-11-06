"use client";

import { useState } from "react";
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
import { CheckCircle2Icon, PopcornIcon, AlertCircleIcon } from "lucide-react";

interface CreateBookingFormProps {
    onSuccess?: () => void;
}

export default function CreateBookingForm({ onSuccess }: CreateBookingFormProps) {
    const [toUserId, setToUserId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const createBooking = useMutation(api.bookings.integrations.writes.createBookingMutation);
    const allUsers = useQuery(api.schemas.users.getAllUsers);
    const currentUser = useQuery(api.schemas.users.getMe);

    // Determine if current user is a tutor
    const isTutor = currentUser?.role === "tutor";
    const selectLabel = isTutor ? "Select Student" : "Select Tutor";
    const selectPlaceholder = isTutor ? "Select a student..." : "Select a tutor...";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!toUserId || !date || !time) {
            setError("Please fill in all fields");
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
            });

            // Reset form
            setToUserId("");
            setDate("");
            setTime("");

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
                    disabled={isSubmitting}
                >
                    {isSubmitting ? "Creating..." : "Create Booking"}
                </Button>
            </div>
        </form>
    );
}

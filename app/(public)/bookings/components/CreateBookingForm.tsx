"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

interface CreateBookingFormProps {
    onSuccess?: () => void;
}

export default function CreateBookingForm({ onSuccess }: CreateBookingFormProps) {
    const [toUserId, setToUserId] = useState("");
    const [date, setDate] = useState("");
    const [time, setTime] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const createBooking = useMutation(api.schemas.bookings.createBooking);
    const allUsers = useQuery(api.schemas.users.getAllUsers);
    const currentUser = useQuery(api.schemas.users.getMe);

    // Determine if current user is a tutor
    const isTutor = currentUser?.role === "tutor";
    const selectLabel = isTutor ? "Select Student" : "Select Tutor";
    const selectPlaceholder = isTutor ? "Select a student..." : "Select a tutor...";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!toUserId || !date || !time) {
            alert("Please fill in all fields");
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

            // Then show success message
            alert("Booking created successfully!");
        } catch (error) {
            console.error("Failed to create booking:", error);
            const errorMessage = error instanceof Error ? error.message : "Failed to create booking. Please try again.";
            alert(errorMessage);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
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

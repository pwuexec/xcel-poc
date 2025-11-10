"use client";

import { useState } from "react";
import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, InfoIcon, PencilIcon } from "lucide-react";
import { TimePicker } from "./TimePicker";

const DAYS_OF_WEEK = [
    { value: "monday", label: "Mon", fullLabel: "Monday" },
    { value: "tuesday", label: "Tue", fullLabel: "Tuesday" },
    { value: "wednesday", label: "Wed", fullLabel: "Wednesday" },
    { value: "thursday", label: "Thu", fullLabel: "Thursday" },
    { value: "friday", label: "Fri", fullLabel: "Friday" },
    { value: "saturday", label: "Sat", fullLabel: "Saturday" },
    { value: "sunday", label: "Sun", fullLabel: "Sunday" },
] as const;

type DayOfWeek = typeof DAYS_OF_WEEK[number]["value"];

interface EditRecurringRuleDialogProps {
    isOpen: boolean;
    onClose: () => void;
    rule: {
        _id: Id<"recurringRules">;
        dayOfWeek: DayOfWeek;
        hourUTC: number;
        minuteUTC: number;
        status: string;
    };
    otherUser: {
        name?: string;
        email?: string;
    };
}

export function EditRecurringRuleDialog({
    isOpen,
    onClose,
    rule,
    otherUser,
}: EditRecurringRuleDialogProps) {
    const [selectedDay, setSelectedDay] = useState<DayOfWeek>(rule.dayOfWeek);
    const [selectedTime, setSelectedTime] = useState(
        `${rule.hourUTC.toString().padStart(2, "0")}:${rule.minuteUTC.toString().padStart(2, "0")}`
    );
    const [isUpdating, setIsUpdating] = useState(false);

    const updateRule = useMutation(api.recurringRules.integrations.writes.updateRecurringRuleSchedule);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const [hour, minute] = selectedTime.split(':').map(Number);
            
            await updateRule({
                ruleId: rule._id,
                dayOfWeek: selectedDay,
                hourUTC: hour,
                minuteUTC: minute,
            });
            
            onClose();
        } catch (error) {
            console.error("Failed to update recurring rule:", error);
            alert(error instanceof Error ? error.message : "Failed to update recurring rule");
        } finally {
            setIsUpdating(false);
        }
    };

    const userName = otherUser.name || otherUser.email || "Unknown User";

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <PencilIcon className="size-5 text-blue-600 dark:text-blue-400" />
                        <DialogTitle>Edit Recurring Booking</DialogTitle>
                    </div>
                    <DialogDescription>
                        Update the schedule for your recurring session with {userName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            Changes will apply to future bookings. Existing bookings will not be affected.
                        </AlertDescription>
                    </Alert>

                    {/* Day Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <CalendarIcon className="size-4" />
                            Day of Week
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => (
                                <Button
                                    key={day.value}
                                    type="button"
                                    variant={selectedDay === day.value ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => setSelectedDay(day.value)}
                                    className="min-w-[60px]"
                                >
                                    {day.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {/* Time Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Time (UTC)</label>
                        <TimePicker
                            value={selectedTime}
                            onChange={setSelectedTime}
                        />
                    </div>

                    {/* Summary */}
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            New Schedule
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Every <span className="font-semibold">
                                {DAYS_OF_WEEK.find(d => d.value === selectedDay)?.fullLabel}
                            </span> at <span className="font-semibold">{selectedTime} UTC</span>
                        </p>
                    </div>

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isUpdating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleUpdate}
                            disabled={isUpdating}
                            className="flex-1 gap-2"
                        >
                            <PencilIcon className="size-4" />
                            {isUpdating ? "Updating..." : "Update Schedule"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

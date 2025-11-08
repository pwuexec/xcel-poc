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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { InfoIcon, RepeatIcon, SaveIcon } from "lucide-react";
import { TimePicker } from "./TimePicker";

const DAYS_OF_WEEK = [
    { value: "monday", label: "Monday" },
    { value: "tuesday", label: "Tuesday" },
    { value: "wednesday", label: "Wednesday" },
    { value: "thursday", label: "Thursday" },
    { value: "friday", label: "Friday" },
    { value: "saturday", label: "Saturday" },
    { value: "sunday", label: "Sunday" },
] as const;

type DayOfWeek = typeof DAYS_OF_WEEK[number]["value"];

interface EditRecurringDialogProps {
    isOpen: boolean;
    onClose: () => void;
    ruleId: Id<"recurringRules">;
    currentDay: DayOfWeek;
    currentHour: number;
    currentMinute: number;
    tutorName: string;
}

export function EditRecurringDialog({
    isOpen,
    onClose,
    ruleId,
    currentDay,
    currentHour,
    currentMinute,
    tutorName,
}: EditRecurringDialogProps) {
    const [dayOfWeek, setDayOfWeek] = useState<DayOfWeek>(currentDay);
    const currentTime = `${currentHour.toString().padStart(2, "0")}:${currentMinute.toString().padStart(2, "0")}`;
    const [time, setTime] = useState(currentTime);
    const [isUpdating, setIsUpdating] = useState(false);

    const updateSchedule = useMutation(api.recurringRules.integrations.writes.updateRecurringRuleSchedule);

    const handleUpdate = async () => {
        setIsUpdating(true);
        try {
            const [hour, minute] = time.split(':').map(Number);
            
            // Check if anything changed
            if (dayOfWeek === currentDay && hour === currentHour && minute === currentMinute) {
                onClose();
                return;
            }

            await updateSchedule({
                ruleId,
                dayOfWeek,
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

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <RepeatIcon className="size-5 text-blue-600 dark:text-blue-400" />
                        <DialogTitle>Edit Recurring Booking</DialogTitle>
                    </div>
                    <DialogDescription>
                        Update the schedule for your recurring session with {tutorName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            Changes will apply to future bookings. Already created bookings won't be affected.
                        </AlertDescription>
                    </Alert>

                    <div className="space-y-2">
                        <label className="text-sm font-medium">Day of Week</label>
                        <Select value={dayOfWeek} onValueChange={(v) => setDayOfWeek(v as DayOfWeek)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {DAYS_OF_WEEK.map((day) => (
                                    <SelectItem key={day.value} value={day.value}>
                                        {day.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <TimePicker
                        value={time}
                        onChange={setTime}
                        label="Time (UTC)"
                    />

                    <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                        <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
                            New Schedule
                        </p>
                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                            Every <span className="font-semibold capitalize">{dayOfWeek}</span> at{' '}
                            <span className="font-semibold">{time}</span> UTC
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
                            <SaveIcon className="size-4" />
                            {isUpdating ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

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
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CalendarIcon, InfoIcon, RepeatIcon, PlusIcon, XIcon } from "lucide-react";
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

interface TimeSlot {
    id: string;
    time: string; // HH:MM format
}

interface RecurringSchedule {
    day: DayOfWeek;
    times: TimeSlot[];
}

interface CreateRecurringDialogProps {
    isOpen: boolean;
    onClose: () => void;
    tutorId: Id<"users">;
    tutorName: string;
    bookingType: "free" | "paid";
    originalTimestamp: number;
}

export function CreateRecurringDialog({
    isOpen,
    onClose,
    tutorId,
    tutorName,
    bookingType,
    originalTimestamp,
}: CreateRecurringDialogProps) {
    // Initialize with the original booking's time
    const originalDate = new Date(originalTimestamp);
    const originalDay = originalDate.toLocaleDateString("en-US", { 
        weekday: "long", 
        timeZone: "UTC" 
    }).toLowerCase() as DayOfWeek;
    const originalTime = `${originalDate.getUTCHours().toString().padStart(2, "0")}:${originalDate.getUTCMinutes().toString().padStart(2, "0")}`;

    const [schedules, setSchedules] = useState<RecurringSchedule[]>([
        {
            day: originalDay,
            times: [{ id: crypto.randomUUID(), time: originalTime }]
        }
    ]);
    const [isCreating, setIsCreating] = useState(false);

    const createRule = useMutation(api.recurringRules.integrations.writes.createRecurringRule);

    const toggleDay = (day: DayOfWeek) => {
        const existingSchedule = schedules.find(s => s.day === day);
        
        if (existingSchedule) {
            // Remove the day
            setSchedules(schedules.filter(s => s.day !== day));
        } else {
            // Add the day with one default time slot
            setSchedules([...schedules, { 
                day, 
                times: [{ id: crypto.randomUUID(), time: originalTime }] 
            }]);
        }
    };

    const addTimeSlot = (day: DayOfWeek) => {
        setSchedules(schedules.map(schedule => 
            schedule.day === day
                ? { ...schedule, times: [...schedule.times, { id: crypto.randomUUID(), time: originalTime }] }
                : schedule
        ));
    };

    const removeTimeSlot = (day: DayOfWeek, timeId: string) => {
        setSchedules(schedules.map(schedule => 
            schedule.day === day
                ? { ...schedule, times: schedule.times.filter(t => t.id !== timeId) }
                : schedule
        ).filter(schedule => schedule.times.length > 0));
    };

    const updateTimeSlot = (day: DayOfWeek, timeId: string, newTime: string) => {
        setSchedules(schedules.map(schedule => 
            schedule.day === day
                ? { 
                    ...schedule, 
                    times: schedule.times.map(t => 
                        t.id === timeId ? { ...t, time: newTime } : t
                    )
                }
                : schedule
        ));
    };

    const handleCreateRules = async () => {
        setIsCreating(true);
        try {
            // Create a rule for each day/time combination
            const promises = schedules.flatMap(schedule =>
                schedule.times.map(timeSlot => {
                    const [hour, minute] = timeSlot.time.split(':').map(Number);
                    return createRule({
                        toUserId: tutorId,
                        dayOfWeek: schedule.day,
                        hourUTC: hour,
                        minuteUTC: minute,
                    });
                })
            );

            await Promise.all(promises);
            onClose();
        } catch (error) {
            console.error("Failed to create recurring rules:", error);
            alert(error instanceof Error ? error.message : "Failed to create recurring rules");
        } finally {
            setIsCreating(false);
        }
    };

    const totalRules = schedules.reduce((sum, schedule) => sum + schedule.times.length, 0);

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-center gap-2">
                        <RepeatIcon className="size-5 text-blue-600 dark:text-blue-400" />
                        <DialogTitle>Create Recurring Bookings</DialogTitle>
                    </div>
                    <DialogDescription>
                        Set up automatic weekly {bookingType} sessions with {tutorName}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <Alert>
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            New bookings will be automatically created every Monday at 00:00 UTC for the upcoming week.
                            Select multiple days and times to create recurring sessions throughout the week.
                        </AlertDescription>
                    </Alert>

                    {/* Day Selection */}
                    <div className="space-y-2">
                        <label className="text-sm font-medium flex items-center gap-2">
                            <CalendarIcon className="size-4" />
                            Select Days
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {DAYS_OF_WEEK.map((day) => {
                                const isSelected = schedules.some(s => s.day === day.value);
                                return (
                                    <Button
                                        key={day.value}
                                        type="button"
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => toggleDay(day.value)}
                                        className="min-w-[60px]"
                                    >
                                        {day.label}
                                    </Button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Time Slots for Each Selected Day */}
                    {schedules.length > 0 ? (
                        <div className="space-y-3">
                            <label className="text-sm font-medium">Time Slots</label>
                            {schedules.map((schedule) => {
                                const dayLabel = DAYS_OF_WEEK.find(d => d.value === schedule.day)?.fullLabel || schedule.day;
                                return (
                                    <Card key={schedule.day} className="p-4 space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h4 className="font-semibold text-sm">{dayLabel}</h4>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                size="sm"
                                                onClick={() => addTimeSlot(schedule.day)}
                                                className="gap-1"
                                            >
                                                <PlusIcon className="size-3" />
                                                Add Time
                                            </Button>
                                        </div>
                                        <div className="space-y-2">
                                            {schedule.times.map((timeSlot) => (
                                                <div key={timeSlot.id} className="flex items-center gap-2">
                                                    <div className="flex-1">
                                                        <TimePicker
                                                            value={timeSlot.time}
                                                            onChange={(newTime) => updateTimeSlot(schedule.day, timeSlot.id, newTime)}
                                                        />
                                                    </div>
                                                    {schedule.times.length > 1 && (
                                                        <Button
                                                            type="button"
                                                            variant="ghost"
                                                            size="sm"
                                                            onClick={() => removeTimeSlot(schedule.day, timeSlot.id)}
                                                            className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                                                        >
                                                            <XIcon className="size-4" />
                                                        </Button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </Card>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="text-center py-8 text-sm text-zinc-500">
                            Select at least one day to create recurring bookings
                        </div>
                    )}

                    {/* Summary */}
                    {totalRules > 0 && (
                        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                            <p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-2">
                                Schedule Summary
                            </p>
                            <div className="space-y-1">
                                {schedules.map((schedule) => {
                                    const dayLabel = DAYS_OF_WEEK.find(d => d.value === schedule.day)?.fullLabel;
                                    return (
                                        <div key={schedule.day} className="text-sm text-zinc-600 dark:text-zinc-400">
                                            <span className="font-semibold">{dayLabel}:</span>{' '}
                                            {schedule.times.map(t => t.time).join(', ')} UTC
                                        </div>
                                    );
                                })}
                            </div>
                            <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-800">
                                <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                    Total: <span className="font-semibold">{totalRules}</span> recurring {totalRules === 1 ? 'booking' : 'bookings'} per week
                                    {' • '}Booking type: <span className="font-semibold capitalize">{bookingType}</span>
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2 pt-2">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            disabled={isCreating}
                            className="flex-1"
                        >
                            Cancel
                        </Button>
                        <Button
                            onClick={handleCreateRules}
                            disabled={isCreating || totalRules === 0}
                            className="flex-1 gap-2"
                        >
                            <RepeatIcon className="size-4" />
                            {isCreating ? "Creating..." : `Create ${totalRules} Recurring ${totalRules === 1 ? 'Booking' : 'Bookings'}`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}

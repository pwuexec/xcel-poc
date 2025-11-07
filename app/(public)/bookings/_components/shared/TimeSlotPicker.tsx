"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { ClockIcon, AlertCircleIcon } from "lucide-react";

interface TimeSlotPickerProps {
    availableSlots: string[];
    busySlots: Array<{ start: string; end: string; user: string }>;
    selectedTime: string;
    onSelectTime: (time: string) => void;
    label?: string;
    isLoading?: boolean;
}

export function TimeSlotPicker({
    availableSlots,
    busySlots,
    selectedTime,
    onSelectTime,
    label = "Available Time Slots",
    isLoading = false,
}: TimeSlotPickerProps) {
    if (isLoading) {
        return (
            <div className="flex flex-col gap-3">
                <Label className="px-1">{label}</Label>
                <div className="p-4 text-center text-muted-foreground text-sm">
                    Loading available times...
                </div>
            </div>
        );
    }

    if (availableSlots.length === 0 && busySlots.length === 0) {
        return (
            <div className="flex flex-col gap-3">
                <Label className="px-1">{label}</Label>
                <Alert>
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                        Select a date to see available time slots
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    if (availableSlots.length === 0 && busySlots.length > 0) {
        return (
            <div className="flex flex-col gap-3">
                <Label className="px-1">{label}</Label>
                <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                        No available time slots on this date. All times are busy.
                    </AlertDescription>
                </Alert>
                {busySlots.length > 0 && (
                    <div className="mt-2 space-y-2">
                        <p className="text-sm font-medium px-1">Busy times:</p>
                        <div className="flex flex-wrap gap-2">
                            {busySlots.map((slot, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                    {slot.start} - {slot.end} ({slot.user})
                                </Badge>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-3">
            <Label className="px-1">{label}</Label>
            
            {busySlots.length > 0 && (
                <div className="space-y-2">
                    <p className="text-sm text-muted-foreground px-1">Busy times on this date:</p>
                    <div className="flex flex-wrap gap-2">
                        {busySlots.map((slot, idx) => (
                            <Badge key={idx} variant="secondary" className="text-xs">
                                {slot.start} - {slot.end} ({slot.user})
                            </Badge>
                        ))}
                    </div>
                </div>
            )}

            <div className="space-y-2">
                <p className="text-sm font-medium px-1 flex items-center gap-2">
                    <ClockIcon className="h-4 w-4" />
                    Available times (5-min intervals)
                </p>
                <div className="max-h-64 overflow-y-auto border rounded-lg p-2 bg-muted/30">
                    <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                        {availableSlots.map((slot) => {
                            const isSelected = selectedTime === `${slot}:00`;
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onSelectTime(`${slot}:00`)}
                                    className={`
                                        px-3 py-2 text-sm font-medium rounded-md transition-colors
                                        ${isSelected 
                                            ? 'bg-primary text-primary-foreground' 
                                            : 'bg-background hover:bg-muted border'
                                        }
                                    `}
                                >
                                    {slot}
                                </button>
                            );
                        })}
                    </div>
                </div>
                <p className="text-xs text-muted-foreground px-1">
                    Times shown in UK timezone • Click a time to select
                </p>
            </div>
        </div>
    );
}

"use client";

import * as React from "react";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ClockIcon, AlertCircleIcon, XIcon, CalendarClockIcon } from "lucide-react";

interface TimeSlotPickerProps {
    availableSlots: string[];
    busySlots: Array<{ start: string; end: string; user: string }>;
    selectedTime: string;
    onSelectTime: (time: string) => void;
    label?: string;
    isLoading?: boolean;
    bookingDurationMinutes?: number;
    disabled?: boolean;
}

export function TimeSlotPicker({
    availableSlots,
    busySlots,
    selectedTime,
    onSelectTime,
    label = "Select a Time",
    isLoading = false,
    bookingDurationMinutes,
    disabled = false,
}: TimeSlotPickerProps) {
    const scrollContainerRef = React.useRef<HTMLDivElement>(null);

    // Handle clear selection
    const handleClear = () => {
        onSelectTime("");
        // Scroll to top of time grid
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollTop = 0;
        }
    };

    // Convert 24h time to 12h format
    const format12Hour = (time24: string) => {
        const [hours, minutes] = time24.split(':').map(Number);
        const period = hours >= 12 ? 'PM' : 'AM';
        const hours12 = hours % 12 || 12;
        return `${hours12}:${minutes.toString().padStart(2, '0')} ${period}`;
    };

    // Calculate end time
    const calculateEndTime = (startTime: string, durationMinutes: number) => {
        const [hours, minutes] = startTime.split(':').map(Number);
        const totalMinutes = hours * 60 + minutes + durationMinutes;
        const endHours = Math.floor(totalMinutes / 60) % 24;
        const endMinutes = totalMinutes % 60;
        return `${endHours.toString().padStart(2, '0')}:${endMinutes.toString().padStart(2, '0')}`;
    };

    // Get time period emoji
    const getTimePeriodEmoji = (time24: string): string => {
        const hours = parseInt(time24.split(':')[0]);
        if (hours >= 6 && hours < 12) return "🌅";
        if (hours >= 12 && hours < 17) return "☀️";
        if (hours >= 17 && hours < 21) return "🌆";
        return "🌙";
    };

    // Get time period label
    const getTimePeriodLabel = (time24: string): string => {
        const hours = parseInt(time24.split(':')[0]);
        if (hours >= 6 && hours < 12) return "Morning";
        if (hours >= 12 && hours < 17) return "Afternoon";
        if (hours >= 17 && hours < 21) return "Evening";
        return "Night";
    };

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
            <div className="flex flex-col gap-4">
                <Label>{label}</Label>
                <Alert variant="destructive">
                    <AlertCircleIcon className="h-4 w-4" />
                    <AlertDescription>
                        No available time slots on this date. All times are busy.
                    </AlertDescription>
                </Alert>
                <div className="space-y-2 p-3 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100 flex items-center gap-2">
                        <AlertCircleIcon className="h-4 w-4" />
                        Unavailable times:
                    </p>
                    <div className="space-y-1.5">
                        {busySlots.map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded border border-red-100 dark:border-red-900">
                                <ClockIcon className="h-3.5 w-3.5 text-red-600 dark:text-red-400 shrink-0" />
                                <span className="text-sm font-medium">
                                    {format12Hour(slot.start)} - {format12Hour(slot.end)}
                                </span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {slot.user}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className={`flex flex-col gap-4 w-full ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
            <div className="space-y-1">
                <div className="flex items-center justify-between min-h-7">
                    <Label className="text-base">{label}</Label>
                    {selectedTime && !disabled && (
                        <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={handleClear}
                            className="h-7 text-xs hover:bg-destructive/10 hover:text-destructive"
                        >
                            <XIcon className="h-3 w-3 mr-1" />
                            Deselect
                        </Button>
                    )}
                </div>
                <div className="flex items-center justify-between min-h-5">
                    <p className="text-xs text-muted-foreground">
                        Choose any available time • UK timezone
                    </p>
                    {bookingDurationMinutes && (
                        <Badge variant="outline" className="text-xs">
                            <CalendarClockIcon className="h-3 w-3 mr-1" />
                            {bookingDurationMinutes} min
                        </Badge>
                    )}
                </div>
            </div>

            {busySlots.length > 0 && (
                <div className="space-y-2 p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800 rounded-lg">
                    <p className="text-sm font-medium text-amber-900 dark:text-amber-100 flex items-center gap-2">
                        <AlertCircleIcon className="h-4 w-4" />
                        Unavailable times on this date:
                    </p>
                    <div className="space-y-1.5">
                        {busySlots.map((slot, idx) => (
                            <div key={idx} className="flex items-center gap-2 p-2 bg-white dark:bg-zinc-800 rounded border border-amber-100 dark:border-amber-900">
                                <ClockIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-400 shrink-0" />
                                <span className="text-sm font-medium">
                                    {format12Hour(slot.start)} - {format12Hour(slot.end)}
                                </span>
                                <Badge variant="secondary" className="ml-auto text-xs">
                                    {slot.user}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Simple scrollable time grid */}
            <div className="space-y-2">
                <p className="text-sm font-medium text-muted-foreground min-h-5">
                    {availableSlots.length} available time{availableSlots.length !== 1 ? 's' : ''}
                </p>
                
                <div ref={scrollContainerRef} className="border rounded-lg p-4 bg-muted/20 h-[600px] overflow-y-auto">
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2">
                        {availableSlots.map((slot) => {
                            const isSelected = selectedTime === `${slot}:00`;
                            const timeLabel = format12Hour(slot);
                            const periodEmoji = getTimePeriodEmoji(slot);
                            const periodLabel = getTimePeriodLabel(slot);
                            
                            return (
                                <button
                                    key={slot}
                                    type="button"
                                    onClick={() => onSelectTime(`${slot}:00`)}
                                    className={`
                                        group relative px-3 py-3 rounded-lg transition-all text-left
                                        ${isSelected 
                                            ? 'bg-primary text-primary-foreground shadow-lg ring-2 ring-primary ring-offset-2 scale-105' 
                                            : 'bg-background hover:bg-primary/10 border-2 border-border hover:border-primary/50 hover:scale-105'
                                        }
                                    `}
                                >
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-1.5">
                                            <span className="text-lg">{periodEmoji}</span>
                                            <span className={`text-sm font-bold ${isSelected ? '' : 'text-foreground'}`}>
                                                {timeLabel}
                                            </span>
                                        </div>
                                        <span className={`text-xs ${isSelected ? 'opacity-90' : 'text-muted-foreground'}`}>
                                            {periodLabel}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

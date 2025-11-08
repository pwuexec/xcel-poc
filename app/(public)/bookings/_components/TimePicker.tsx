"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
    label?: string;
}

export function TimePicker({ value, onChange, label = "Time" }: TimePickerProps) {
    return (
        <div className="flex flex-col gap-3">
            {label && (
                <Label htmlFor="time-picker" className="px-1">
                    {label}
                </Label>
            )}
            <Input
                type="time"
                id="time-picker"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
        </div>
    );
}

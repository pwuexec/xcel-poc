"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface TimePickerProps {
    value: string;
    onChange: (time: string) => void;
}

export function TimePicker({ value, onChange }: TimePickerProps) {
    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor="time-picker" className="px-1">
                Time
            </Label>
            <Input
                type="time"
                id="time-picker"
                step="1"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className="bg-background appearance-none [&::-webkit-calendar-picker-indicator]:hidden [&::-webkit-calendar-picker-indicator]:appearance-none"
            />
        </div>
    );
}

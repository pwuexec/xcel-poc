"use client";

import * as React from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
    label?: string;
    disabled?: boolean;
}

function formatDate(date: Date | undefined) {
    if (!date) {
        return "";
    }

    return date.toLocaleDateString("en-US", {
        day: "2-digit",
        month: "long",
        year: "numeric",
    });
}

export function DatePicker({ value, onChange, label = "Schedule Date", disabled = false }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [month, setMonth] = React.useState<Date | undefined>(value);

    // Get current UK date (start of day)
    const getUKStartOfToday = () => {
        const now = new Date();
        const ukDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
        ukDate.setHours(0, 0, 0, 0);
        return ukDate;
    };

    const minDate = getUKStartOfToday();

    const handleDateSelect = (date: Date | undefined) => {
        if (date && date >= minDate) {
            onChange(date);
            setOpen(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor="date" className={`px-1 ${disabled ? 'opacity-50' : ''}`}>
                {label}
            </Label>
            <Popover open={open && !disabled} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <Button
                        type="button"
                        variant="outline"
                        className="w-full justify-start text-left font-normal"
                        disabled={disabled}
                    >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {value ? formatDate(value) : <span className="text-muted-foreground">Pick a date</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto overflow-hidden p-0" align="start">
                    <Calendar
                        mode="single"
                        selected={value}
                        captionLayout="dropdown"
                        month={month}
                        onMonthChange={setMonth}
                        onSelect={handleDateSelect}
                        disabled={(date) => date < minDate}
                        fromDate={minDate}
                    />
                </PopoverContent>
            </Popover>
        </div>
    );
}

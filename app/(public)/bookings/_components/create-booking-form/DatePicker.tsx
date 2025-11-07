"use client";

import * as React from "react";
import { parseDate } from "chrono-node";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

interface DatePickerProps {
    value: Date | undefined;
    onChange: (date: Date | undefined) => void;
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

export function DatePicker({ value, onChange }: DatePickerProps) {
    const [open, setOpen] = React.useState(false);
    const [inputValue, setInputValue] = React.useState(formatDate(value));
    const [month, setMonth] = React.useState<Date | undefined>(value);

    // Get current UK date (start of day)
    const getUKStartOfToday = () => {
        const now = new Date();
        const ukDate = new Date(now.toLocaleString("en-US", { timeZone: "Europe/London" }));
        ukDate.setHours(0, 0, 0, 0);
        return ukDate;
    };

    const minDate = getUKStartOfToday();

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        
        const parsedDate = parseDate(newValue);
        if (parsedDate) {
            // Check if date is in the past
            if (parsedDate >= minDate) {
                onChange(parsedDate);
                setMonth(parsedDate);
            }
        }
    };

    const handleDateSelect = (date: Date | undefined) => {
        if (date && date >= minDate) {
            onChange(date);
            setInputValue(formatDate(date));
            setOpen(false);
        }
    };

    return (
        <div className="flex flex-col gap-3">
            <Label htmlFor="date" className="px-1">
                Schedule Date
            </Label>
            <div className="relative flex gap-2">
                <Input
                    id="date"
                    value={inputValue}
                    placeholder="Tomorrow or next week"
                    className="bg-background pr-10"
                    onChange={handleInputChange}
                    onKeyDown={(e) => {
                        if (e.key === "ArrowDown") {
                            e.preventDefault();
                            setOpen(true);
                        }
                    }}
                />
                <Popover open={open} onOpenChange={setOpen}>
                    <PopoverTrigger asChild>
                        <Button
                            type="button"
                            id="date-picker"
                            variant="ghost"
                            className="absolute top-1/2 right-2 size-6 -translate-y-1/2"
                        >
                            <CalendarIcon className="size-3.5" />
                            <span className="sr-only">Select date</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto overflow-hidden p-0" align="end">
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
        </div>
    );
}

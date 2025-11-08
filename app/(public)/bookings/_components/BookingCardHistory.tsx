"use client";

import { useState } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { formatBookingEvent, getEventIcon, BookingEventData } from "@/lib/formatBookingEvent";

interface BookingCardHistoryProps {
    events: BookingEventData[];
}

export function BookingCardHistory({ events }: BookingCardHistoryProps) {
    const [isExpanded, setIsExpanded] = useState(false);

    if (events.length === 0) {
        return null;
    }

    return (
        <>
            <Separator />
            <div>
                <button
                    onClick={() => setIsExpanded(!isExpanded)}
                    className="w-full px-6 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                >
                    <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                        History ({events.length} event{events.length !== 1 ? 's' : ''})
                    </span>
                    {isExpanded ? (
                        <ChevronUpIcon className="size-4 text-zinc-400" />
                    ) : (
                        <ChevronDownIcon className="size-4 text-zinc-400" />
                    )}
                </button>

                {isExpanded && (
                    <div className="px-6 pb-6 space-y-3">
                        {events.map((event, index) => (
                            <div
                                key={index}
                                className="flex items-start gap-3 text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800"
                            >
                                <span className="text-lg">{getEventIcon(event.type)}</span>
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 flex-wrap mb-1">
                                        <span className="font-semibold text-zinc-900 dark:text-zinc-100 capitalize">
                                            {event.type.replace(/_/g, " ")}
                                        </span>
                                        <span className="text-zinc-500 dark:text-zinc-500">
                                            by {event.userName}
                                        </span>
                                    </div>
                                    <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                        {formatBookingEvent(event)}
                                    </p>
                                    <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-1">
                                        {new Date(event.timestamp).toLocaleString('en-GB', {
                                            year: "numeric",
                                            month: "short",
                                            day: "numeric",
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            timeZone: "Europe/London",
                                        })}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}

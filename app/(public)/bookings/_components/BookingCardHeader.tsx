"use client";

import { Badge } from "@/components/ui/badge";

interface BookingCardHeaderProps {
    otherPartyName: string;
    otherPartyImage?: string;
    userRole: "tutor" | "student";
    status: string;
    isPaid: boolean;
    bookingType: "free" | "paid";
}

// Status badge configuration
const STATUS_BADGES = {
    pending: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-900", label: "Pending", variant: undefined },
    awaiting_reschedule: { className: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-500 dark:border-amber-900", label: "Pending", variant: undefined },
    awaiting_payment: { className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-500 dark:border-purple-900", label: "Payment Required", variant: undefined },
    processing_payment: { className: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-500 dark:border-purple-900", label: "Payment Required", variant: undefined },
    confirmed: { className: "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-500 dark:border-green-900", label: "Confirmed", variant: undefined },
    completed: { className: "bg-zinc-50 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400", label: "Completed", variant: "outline" as const },
    canceled: { className: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800", label: "Cancelled", variant: "outline" as const },
    rejected: { className: "bg-zinc-50 text-zinc-600 border-zinc-200 dark:bg-zinc-900/30 dark:text-zinc-400 dark:border-zinc-800", label: "Cancelled", variant: "outline" as const },
} as const;

function getStatusBadge(status: string) {
    const config = STATUS_BADGES[status as keyof typeof STATUS_BADGES] || {
        className: "",
        label: String(status).replace(/_/g, " "),
        variant: "outline" as const
    };
    
    return (
        <Badge variant={config.variant} className={config.className}>
            {config.label}
        </Badge>
    );
}

export function BookingCardHeader({
    otherPartyName,
    otherPartyImage,
    userRole,
    status,
    isPaid,
    bookingType,
}: BookingCardHeaderProps) {
    return (
        <div className="flex items-start justify-between gap-4 mb-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                {otherPartyImage ? (
                    <img
                        src={otherPartyImage}
                        alt={otherPartyName}
                        className="h-14 w-14 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800 shadow-sm"
                    />
                ) : (
                    <div className="h-14 w-14 rounded-full bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center ring-2 ring-zinc-100 dark:ring-zinc-800 shadow-sm">
                        <span className="text-xl font-bold text-zinc-700 dark:text-zinc-300">
                            {otherPartyName[0]?.toUpperCase() || "?"}
                        </span>
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 truncate">
                        {otherPartyName}
                    </h3>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">
                        {userRole === "tutor" ? "Student" : "Your Tutor"}
                    </p>
                </div>
            </div>
            <div className="flex flex-col items-end gap-2">
                {getStatusBadge(status)}
                {isPaid && (
                    <Badge variant="default" className="bg-emerald-600 text-white border-emerald-600">
                        Paid
                    </Badge>
                )}
                {bookingType === "free" && (
                    <Badge variant="success" className="bg-blue-600 text-white border-blue-600">
                        Free Meeting
                    </Badge>
                )}
            </div>
        </div>
    );
}

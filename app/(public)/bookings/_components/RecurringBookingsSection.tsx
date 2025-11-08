"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    CalendarIcon,
    ClockIcon,
    CheckIcon,
    InfoIcon,
    RepeatIcon,
} from "lucide-react";

export function RecurringBookingsSection() {
    const recurringRules = useQuery(api.recurringRules.integrations.reads.getMyRecurringRules);
    const pauseRule = useMutation(api.recurringRules.integrations.writes.pauseRecurringRule);
    const resumeRule = useMutation(api.recurringRules.integrations.writes.resumeRecurringRule);
    const deleteRule = useMutation(api.recurringRules.integrations.writes.deleteRecurringRule);

    const formatDay = (day: string) => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    const formatTime = (hour: number, minute: number) => {
        return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")} UTC`;
    };

    const getStatusBadgeVariant = (status: string) => {
        switch (status) {
            case "active":
                return "default";
            case "paused":
                return "secondary";
            case "canceled":
                return "destructive";
            default:
                return "outline";
        }
    };

    if (recurringRules === undefined) {
        return (
            <div className="space-y-4">
                {[...Array(2)].map((_, i) => (
                    <Card key={i} className="border-zinc-200 dark:border-zinc-800">
                        <CardContent className="p-6">
                            <div className="flex items-center gap-4">
                                <Skeleton className="h-12 w-12 rounded-full" />
                                <div className="flex-1 space-y-2">
                                    <Skeleton className="h-5 w-48" />
                                    <Skeleton className="h-4 w-32" />
                                </div>
                                <Skeleton className="h-9 w-24" />
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!recurringRules || recurringRules.length === 0) {
        return (
            <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
                <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="text-6xl mb-4">
                        <RepeatIcon className="size-16 mx-auto text-zinc-400 dark:text-zinc-600" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                        No recurring bookings yet
                    </h3>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-md">
                        Set up automatic weekly sessions with your tutors. Bookings will be created automatically every week!
                    </p>
                    <Alert className="max-w-md">
                        <InfoIcon className="h-4 w-4" />
                        <AlertDescription className="text-sm">
                            To create a recurring booking, book a regular session first, then set up the recurring rule from the tutor's profile.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-4">
            {recurringRules.map((item: any) => {
                const otherUser = item.currentUser._id === item.rule.fromUserId ? item.toUser : item.fromUser;
                const isTutor = item.currentUser.role === "tutor";

                return (
                    <Card key={item.rule._id} className="overflow-hidden hover:shadow-lg transition-all duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <CardContent className="p-6">
                            <div className="flex items-start justify-between gap-4">
                                {/* User info */}
                                <div className="flex items-center gap-4 flex-1 min-w-0">
                                    {otherUser.image ? (
                                        <img
                                            src={otherUser.image}
                                            alt={otherUser.name || "User"}
                                            className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800 shadow-sm"
                                        />
                                    ) : (
                                        <div className="h-12 w-12 rounded-full bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center ring-2 ring-zinc-100 dark:ring-zinc-800 shadow-sm">
                                            <span className="text-lg font-bold text-zinc-700 dark:text-zinc-300">
                                                {otherUser?.name?.[0]?.toUpperCase() || "?"}
                                            </span>
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <RepeatIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 truncate">
                                                {otherUser.name || otherUser.email || "Unknown User"}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">
                                            {isTutor ? "Student" : "Your Tutor"}
                                        </p>
                                    </div>
                                </div>

                                {/* Status badge */}
                                <Badge variant={getStatusBadgeVariant(item.rule.status) as any}>
                                    {item.rule.status}
                                </Badge>
                            </div>

                            <Separator className="my-4" />

                            {/* Schedule info */}
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <CalendarIcon className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">Every</p>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {formatDay(item.rule.dayOfWeek)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                    <ClockIcon className="size-5 text-blue-600 dark:text-blue-400 shrink-0" />
                                    <div className="min-w-0">
                                        <p className="text-xs text-zinc-500 dark:text-zinc-500 font-medium">At</p>
                                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                            {formatTime(item.rule.hourUTC, item.rule.minuteUTC)}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Last booking info */}
                            {item.rule.lastBookingCreatedAt && (
                                <div className="mb-4 p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg border border-zinc-100 dark:border-zinc-800">
                                    <div className="flex items-center gap-2 text-zinc-600 dark:text-zinc-400">
                                        <CheckIcon className="size-4 text-green-600 dark:text-green-400" />
                                        <span className="text-sm">
                                            Last booking created on {new Date(item.rule.lastBookingCreatedAt).toLocaleDateString("en-GB", {
                                                day: "numeric",
                                                month: "short",
                                                year: "numeric",
                                            })}
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Info banner */}
                            <Alert className="mb-4">
                                <InfoIcon className="h-4 w-4" />
                                <AlertDescription className="text-sm">
                                    Bookings are automatically created every Monday at 00:00 UTC for the upcoming week.
                                </AlertDescription>
                            </Alert>

                            {/* Actions */}
                            <div className="flex gap-2">
                                {item.rule.status === "active" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await pauseRule({ ruleId: item.rule._id });
                                            } catch (error) {
                                                alert(error instanceof Error ? error.message : "Failed to pause rule");
                                            }
                                        }}
                                    >
                                        Pause
                                    </Button>
                                )}
                                {item.rule.status === "paused" && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await resumeRule({ ruleId: item.rule._id });
                                            } catch (error) {
                                                alert(error instanceof Error ? error.message : "Failed to resume rule");
                                            }
                                        }}
                                    >
                                        Resume
                                    </Button>
                                )}
                                <Button
                                    variant="destructive"
                                    size="sm"
                                    onClick={async () => {
                                        if (!confirm("Are you sure you want to delete this recurring rule? This action cannot be undone.")) return;
                                        try {
                                            await deleteRule({ ruleId: item.rule._id });
                                        } catch (error) {
                                            alert(error instanceof Error ? error.message : "Failed to delete rule");
                                        }
                                    }}
                                >
                                    Delete
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                );
            })}
        </div>
    );
}

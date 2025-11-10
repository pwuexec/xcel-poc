"use client";

import { api } from "@/convex/_generated/api";
import { useMutation, useQuery } from "convex/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatUTCHourMinuteToUK } from "@/lib/dateTime";
import { useState } from "react";
import {
    CalendarIcon,
    ClockIcon,
    CheckIcon,
    InfoIcon,
    RepeatIcon,
    UserIcon,
    PencilIcon,
} from "lucide-react";
import { EditRecurringRuleDialog } from "./EditRecurringRuleDialog";

export function RecurringBookingsSection() {
    const recurringRules = useQuery(api.recurringRules.integrations.reads.getMyRecurringRules);
    const pauseRule = useMutation(api.recurringRules.integrations.writes.pauseRecurringRule);
    const resumeRule = useMutation(api.recurringRules.integrations.writes.resumeRecurringRule);
    const deleteRule = useMutation(api.recurringRules.integrations.writes.deleteRecurringRule);

    const [groupBy, setGroupBy] = useState<"tutor" | "weekday">("tutor");
    const [editingRule, setEditingRule] = useState<any>(null);

    const formatDay = (day: string) => {
        return day.charAt(0).toUpperCase() + day.slice(1);
    };

    const formatTime = (hour: number, minute: number) => {
        return formatUTCHourMinuteToUK(hour, minute);
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

    // Day order for sorting
    const dayOrder = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

    // Group rules by tutor or weekday
    const groupRules = () => {
        if (groupBy === "tutor") {
            const groups = new Map<string, { tutorName: string; items: any[] }>();
            
            recurringRules.forEach((item: any) => {
                const otherUser = item.currentUser._id === item.rule.fromUserId ? item.toUser : item.fromUser;
                const tutorId = otherUser._id;
                const tutorName = otherUser.name || otherUser.email || "Unknown User";
                
                if (!groups.has(tutorId)) {
                    groups.set(tutorId, { tutorName, items: [] });
                }
                groups.get(tutorId)!.items.push(item);
            });

            // Sort items within each tutor group by day then time
            groups.forEach(group => {
                group.items.sort((a: any, b: any) => {
                    const dayDiff = dayOrder.indexOf(a.rule.dayOfWeek) - dayOrder.indexOf(b.rule.dayOfWeek);
                    if (dayDiff !== 0) return dayDiff;
                    return (a.rule.hourUTC * 60 + a.rule.minuteUTC) - (b.rule.hourUTC * 60 + b.rule.minuteUTC);
                });
            });

            return Array.from(groups.values()).sort((a, b) => a.tutorName.localeCompare(b.tutorName));
        } else {
            const groups = new Map<string, { day: string; items: any[] }>();
            
            recurringRules.forEach((item: any) => {
                const day = item.rule.dayOfWeek;
                
                if (!groups.has(day)) {
                    groups.set(day, { day, items: [] });
                }
                groups.get(day)!.items.push(item);
            });

            // Sort items within each day group by time
            groups.forEach(group => {
                group.items.sort((a: any, b: any) => {
                    return (a.rule.hourUTC * 60 + a.rule.minuteUTC) - (b.rule.hourUTC * 60 + b.rule.minuteUTC);
                });
            });

            return Array.from(groups.values()).sort((a, b) => 
                dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
            );
        }
    };

    const groupedRules = groupRules();

    return (
        <div className="space-y-6">
            {/* Group By Selector */}
            <div className="flex items-center gap-3 bg-zinc-50 dark:bg-zinc-900 p-4 rounded-lg border border-zinc-200 dark:border-zinc-800">
                <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                    Group by:
                </label>
                <Select value={groupBy} onValueChange={(value) => setGroupBy(value as "tutor" | "weekday")}>
                    <SelectTrigger className="w-[180px]">
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="tutor">
                            <div className="flex items-center gap-2">
                                <UserIcon className="size-4" />
                                Tutor
                            </div>
                        </SelectItem>
                        <SelectItem value="weekday">
                            <div className="flex items-center gap-2">
                                <CalendarIcon className="size-4" />
                                Weekday
                            </div>
                        </SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Render Grouped Rules */}
            {groupedRules.map((group: any, groupIndex: number) => (
                <div key={groupIndex} className="space-y-3">
                    {/* Group Header */}
                    <div className="flex items-center gap-3">
                        <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
                            {groupBy === "tutor" ? (
                                <>
                                    <UserIcon className="size-5 text-blue-600 dark:text-blue-400" />
                                    {group.tutorName}
                                </>
                            ) : (
                                <>
                                    <CalendarIcon className="size-5 text-blue-600 dark:text-blue-400" />
                                    {formatDay(group.day)}
                                </>
                            )}
                        </h3>
                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                        <Badge variant="secondary">{group.items.length}</Badge>
                    </div>

                    {/* Rules in this group */}
                    {group.items.map((item: any) => {
                        const otherUser = item.currentUser._id === item.rule.fromUserId ? item.toUser : item.fromUser;

                        return (
                            <Card key={item.rule._id} className="overflow-hidden hover:shadow-md transition-all duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between gap-4">
                                        {/* Left side: Schedule info */}
                                        <div className="flex items-center gap-4 flex-1">
                                            {/* Day and Time */}
                                            <div className="flex items-center gap-3">
                                                {groupBy === "weekday" ? (
                                                    // Show tutor name when grouped by weekday
                                                    <>
                                                        {otherUser.image ? (
                                                            <img
                                                                src={otherUser.image}
                                                                alt={otherUser.name || "User"}
                                                                className="h-10 w-10 rounded-full object-cover ring-2 ring-zinc-100 dark:ring-zinc-800"
                                                            />
                                                        ) : (
                                                            <div className="h-10 w-10 rounded-full bg-linear-to-br from-zinc-200 to-zinc-300 dark:from-zinc-700 dark:to-zinc-800 flex items-center justify-center ring-2 ring-zinc-100 dark:ring-zinc-800">
                                                                <span className="text-sm font-bold text-zinc-700 dark:text-zinc-300">
                                                                    {otherUser?.name?.[0]?.toUpperCase() || "?"}
                                                                </span>
                                                            </div>
                                                        )}
                                                        <div>
                                                            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                                                                {otherUser.name || otherUser.email || "Unknown User"}
                                                            </p>
                                                            <p className="text-xs text-zinc-500 dark:text-zinc-500">
                                                                {formatTime(item.rule.hourUTC, item.rule.minuteUTC)}
                                                            </p>
                                                        </div>
                                                    </>
                                                ) : (
                                                    // Show day and time when grouped by tutor
                                                    <>
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                            <CalendarIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                                {formatDay(item.rule.dayOfWeek)}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-100 dark:border-blue-800">
                                                            <ClockIcon className="size-4 text-blue-600 dark:text-blue-400" />
                                                            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                                                {formatTime(item.rule.hourUTC, item.rule.minuteUTC)}
                                                            </span>
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </div>

                                        {/* Right side: Status and Actions */}
                                        <div className="flex items-center gap-2">
                                            <Badge variant={getStatusBadgeVariant(item.rule.status) as any} className="shrink-0">
                                                {item.rule.status}
                                            </Badge>

                                            {/* Actions */}
                                            <div className="flex gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => setEditingRule(item)}
                                                    className="gap-1.5"
                                                >
                                                    <PencilIcon className="size-3.5" />
                                                    Edit
                                                </Button>
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
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={async () => {
                                                        if (!confirm("Are you sure you want to delete this recurring rule? This action cannot be undone.")) return;
                                                        try {
                                                            await deleteRule({ ruleId: item.rule._id });
                                                        } catch (error) {
                                                            alert(error instanceof Error ? error.message : "Failed to delete rule");
                                                        }
                                                    }}
                                                    className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950"
                                                >
                                                    Delete
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ))}

            {/* Edit Dialog */}
            {editingRule && (
                <EditRecurringRuleDialog
                    isOpen={!!editingRule}
                    onClose={() => setEditingRule(null)}
                    rule={editingRule.rule}
                    otherUser={editingRule.currentUser._id === editingRule.rule.fromUserId ? editingRule.toUser : editingRule.fromUser}
                />
            )}
        </div>
    );
}

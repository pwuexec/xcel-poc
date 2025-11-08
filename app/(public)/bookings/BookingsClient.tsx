"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ACTIVE_STATUSES, PAST_STATUSES } from "@/convex/bookings/types/bookingStatuses";
import { useMutation, useQuery } from "convex/react";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { useRouter } from "next/navigation";
import PaymentButton from "./_components/PaymentButton";
import { BookingCard } from "./_components/BookingCard";
import { FunctionReturnType } from "convex/server";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    CalendarIcon,
    ClockIcon,
    CheckIcon,
    PlusIcon,
    InfoIcon,
    RepeatIcon,
} from "lucide-react";

type BookingWithUsers = FunctionReturnType<typeof api.bookings.integrations.reads.getMyBookingsWithCounts>["page"][0];

interface BookingsClientProps {
    initialStatus?: string;
}

export function BookingsClient({ initialStatus }: BookingsClientProps) {
    const router = useRouter();
    const { getParam, setParam, setParams, removeParam, removeParams } = useSearchParamsState();

    const statusFilter = getParam("status") || initialStatus || "active";
    const action = getParam("action");
    const bookingId = getParam("bookingId");

    // Map tab to status array from Convex
    const statusesToFetch = statusFilter === "past" ? [...PAST_STATUSES] : [...ACTIVE_STATUSES];

    // Use optimized single query with counts and pagination
    const bookingsData = useQuery(
        api.bookings.integrations.reads.getMyBookingsWithCounts,
        { 
            statuses: statusesToFetch,
            paginationOpts: { numItems: 50, cursor: null } // Fetch more upfront since we don't have load more
        }
    );

    const results = bookingsData?.page;
    const status = bookingsData === undefined ? "LoadingFirstPage" : "Exhausted";
    
    const isPaymentDialogOpen = action === "payment" && !!bookingId;

    const handleOpenDialog = (dialogAction: string, id?: Id<"bookings"> | string) => {
        if (dialogAction === "create") {
            router.push("/bookings/new");
            return;
        }
        
        const params: Record<string, string> = { action: dialogAction };
        if (id) {
            params.bookingId = id as string;
        }
        setParams(params);
    };

    const handleCloseDialog = () => {
        removeParams(["bookingId", "action"]);
    };

    const selectedBooking = bookingId
        ? results?.find((item: any) => String(item.booking._id) === bookingId)
        : null;

    const statusCounts = bookingsData?.counts || {
        active: 0,
        past: 0,
        pending: 0,
    };

    const handleTabChange = (value: string) => {
        setParam("status", value);
    };

    // Group bookings by date
    const now = new Date();
    const ukNow = new Date(now.toLocaleString('en-US', { timeZone: 'Europe/London' }));
    const ukToday = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate());

    let groupedBookings: { label: string; bookings: any[] }[] = [];
    if (results) {
        const groups: { label: string; bookings: any[] }[] = [];
        
        results.forEach((item: any) => {
            // Convert booking timestamp to UK timezone
            const bookingUTC = new Date(item.booking.timestamp);
            const bookingUK = new Date(bookingUTC.toLocaleString('en-US', { timeZone: 'Europe/London' }));
            const bookingDate = new Date(bookingUK.getFullYear(), bookingUK.getMonth(), bookingUK.getDate());
            
            const diffTime = bookingDate.getTime() - ukToday.getTime();
            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

            let label: string;
            
            if (diffDays === 0) {
                label = "Today";
            } else if (diffDays === 1) {
                label = "Tomorrow";
            } else if (diffDays === -1) {
                label = "Yesterday";
            } else if (diffDays === 2) {
                label = "In 2 days";
            } else if (diffDays > 2 && diffDays < 7) {
                label = `In ${diffDays} days`;
            } else if (diffDays >= 7 && diffDays < 14) {
                const weeks = Math.floor(diffDays / 7);
                const remainingDays = diffDays % 7;
                if (remainingDays === 0) {
                    label = `In ${weeks} week${weeks > 1 ? 's' : ''}`;
                } else {
                    label = `In ${weeks} week and ${remainingDays} day${remainingDays > 1 ? 's' : ''}`;
                }
            } else if (diffDays >= 14) {
                label = bookingDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/London",
                });
            } else if (diffDays < -1 && diffDays > -7) {
                label = `${Math.abs(diffDays)} days ago`;
            } else if (diffDays <= -7) {
                label = bookingDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/London",
                });
            } else {
                label = bookingDate.toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "long",
                    timeZone: "Europe/London",
                });
            }

            const existingGroup = groups.find(g => g.label === label);
            if (existingGroup) {
                existingGroup.bookings.push(item);
            } else {
                groups.push({ label, bookings: [item] });
            }
        });

        // Sort groups by the first booking's date in each group
        groups.sort((a, b) => {
            const aTime = a.bookings[0]?.booking.timestamp || 0;
            const bTime = b.bookings[0]?.booking.timestamp || 0;
            return aTime - bTime;
        });

        groupedBookings = groups;
    }

    return (
        <div className="min-h-screen bg-linear-to-br from-zinc-50 via-white to-zinc-50 dark:from-zinc-950 dark:via-zinc-900 dark:to-zinc-950">
            <div className="mx-auto max-w-6xl px-4 py-8 md:py-12">
                {/* Header */}
                <div className="mb-4">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                        <div>
                            <h1 className="text-4xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                My Sessions
                            </h1>
                            <p className="text-base text-zinc-600 dark:text-zinc-400">
                                Book, manage, and attend your tutoring sessions
                            </p>
                        </div>
                        <Button
                            onClick={() => handleOpenDialog("create")}
                            size="lg"
                            className="gap-2 shadow-lg hover:shadow-xl transition-shadow"
                        >
                            <PlusIcon className="size-5" />
                            Book a Session
                        </Button>
                    </div>

                    {/* Tabs Filter */}
                    <Tabs value={statusFilter} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-3 h-auto p-1">
                            <TabsTrigger value="active" className="gap-2 py-2.5">
                                <span>Active</span>
                                {statusCounts.active > 0 && (
                                    <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                                        {statusCounts.active}
                                    </Badge>
                                )}
                            </TabsTrigger>
                            <TabsTrigger value="recurring" className="gap-2 py-2.5">
                                <RepeatIcon className="size-4" />
                                <span>Recurring</span>
                            </TabsTrigger>
                            <TabsTrigger value="past" className="gap-2 py-2.5">
                                <span>Past</span>
                                {statusCounts.past > 0 && (
                                    <Badge variant="secondary" className="ml-1 px-1.5 py-0">
                                        {statusCounts.past}
                                    </Badge>
                                )}
                            </TabsTrigger>
                        </TabsList>
                    </Tabs>

                    {/* Pending Bookings Alert */}
                    {statusCounts.pending > 0 && statusFilter !== "past" && (
                        <Alert className="mt-3 py-2 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/50">
                            <InfoIcon className="h-3.5 w-3.5 text-amber-600 dark:text-amber-500" />
                            <AlertDescription className="text-xs text-amber-800 dark:text-amber-200">
                                {statusCounts.pending} pending confirmation
                            </AlertDescription>
                        </Alert>
                    )}
                </div>

                {/* Bookings List */}
                <div className="space-y-4">
                    {/* Show recurring bookings tab */}
                    {statusFilter === "recurring" && <RecurringBookingsSection />}

                    {/* Show regular bookings for active and past */}
                    {statusFilter !== "recurring" && (
                        <>
                            {status === "LoadingFirstPage" && (
                                <>
                                    {[...Array(3)].map((_, i) => (
                                        <BookingCardSkeleton key={i} />
                                    ))}
                                </>
                            )}

                            {results?.length === 0 && status !== "LoadingFirstPage" && (
                                <EmptyState statusFilter={statusFilter} onCreateBooking={() => handleOpenDialog("create")} />
                            )}

                            {groupedBookings.map((group, groupIndex) => (
                                <div key={groupIndex} className="space-y-3">
                                    <div className="flex items-center gap-3">
                                        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
                                            {group.label}
                                        </h2>
                                        <div className="flex-1 h-px bg-zinc-200 dark:bg-zinc-800"></div>
                                    </div>
                                    <div className="space-y-4">
                                        {group.bookings.map((item: any) => (
                                            <BookingCard
                                                key={item.booking._id}
                                                booking={item.booking}
                                                toUser={item.toUser}
                                                fromUser={item.fromUser}
                                                currentUser={item.currentUser}
                                                unreadCount={item.unreadCount}
                                                onOpenDialog={handleOpenDialog}
                                            />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            {selectedBooking && (
                <>
                    <PaymentBookingDialog
                        isOpen={isPaymentDialogOpen}
                        onClose={handleCloseDialog}
                        bookingId={selectedBooking.booking._id}
                        customerEmail={selectedBooking.currentUser.email || ""}
                        customerName={selectedBooking.currentUser.name}
                    />
                </>
            )}
        </div>
    );
}

// ==================== Empty State ====================

// ==================== Recurring Bookings Section ====================

function RecurringBookingsSection() {
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

// ==================== Empty State ====================

interface EmptyStateProps {
    statusFilter: string;
    onCreateBooking: () => void;
}

function EmptyState({ statusFilter, onCreateBooking }: EmptyStateProps) {
    const getEmptyStateContent = () => {
        switch (statusFilter) {
            case "active":
                return {
                    icon: "📅",
                    title: "No active sessions",
                    description: "You don't have any sessions scheduled or pending confirmation.",
                };
            case "past":
                return {
                    icon: "📚",
                    title: "No past sessions",
                    description: "Your completed sessions will appear here.",
                };
            case "recurring":
                return {
                    icon: "🔄",
                    title: "No recurring bookings",
                    description: "Set up automatic weekly sessions with your tutors.",
                };
            default:
                return {
                    icon: "🎓",
                    title: "Start your learning journey",
                    description: "Book your first tutoring session to get started!",
                };
        }
    };

    const content = getEmptyStateContent();

    return (
        <Card className="border-2 border-dashed border-zinc-200 dark:border-zinc-800">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <div className="text-6xl mb-4">{content.icon}</div>
                <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                    {content.title}
                </h3>
                <p className="text-zinc-600 dark:text-zinc-400 mb-6 max-w-sm">
                    {content.description}
                </p>
                <Button onClick={onCreateBooking} size="lg" className="gap-2">
                    <PlusIcon className="size-5" />
                    Book a Session
                </Button>
            </CardContent>
        </Card>
    );
}

// ==================== Booking Card ====================
// BookingCard component has been extracted to _components/BookingCard.tsx

// ==================== Dialogs ====================

interface PaymentBookingDialogProps {
    isOpen: boolean;
    onClose: () => void;
    bookingId: Id<"bookings">;
    customerEmail: string;
    customerName?: string;
}

function PaymentBookingDialog({ isOpen, onClose, bookingId, customerEmail, customerName }: PaymentBookingDialogProps) {
    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Complete Payment</DialogTitle>
                    <DialogDescription>
                        Secure payment for your tutoring session
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <PaymentButton
                        bookingId={bookingId}
                        customerEmail={customerEmail}
                        customerName={customerName}
                    />
                </div>
            </DialogContent>
        </Dialog>
    );
}

// ==================== Skeleton ====================

function BookingCardSkeleton() {
    return (
        <Card className="overflow-hidden border-zinc-200 dark:border-zinc-800">
            <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                    <Skeleton className="h-14 w-14 rounded-full" />
                    <div className="flex-1 space-y-2">
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                    <Skeleton className="h-6 w-24 rounded-full" />
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <Skeleton className="h-16 rounded-lg" />
                    <Skeleton className="h-16 rounded-lg" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                    <Skeleton className="h-10 rounded-md" />
                    <Skeleton className="h-10 rounded-md" />
                </div>
            </CardContent>
        </Card>
    );
}

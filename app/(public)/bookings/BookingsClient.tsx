"use client";

import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { ACTIVE_STATUSES, PAST_STATUSES } from "@/convex/bookings/types/bookingStatuses";
import { useMutation, useQuery } from "convex/react";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import { useRouter } from "next/navigation";
import PaymentButton from "./_components/PaymentButton";
import { BookingCard } from "./_components/BookingCard";
import { RecurringBookingsSection } from "./_components/RecurringBookingsSection";
import { formatUKDate, formatUKTime, getCurrentUKTime } from "@/lib/dateTime";
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

    // Group bookings by date (using UK timezone)
    const ukNow = getCurrentUKTime();
    const ukToday = new Date(ukNow.getFullYear(), ukNow.getMonth(), ukNow.getDate());

    let groupedBookings: { label: string; bookings: any[] }[] = [];
    if (results) {
        const groups: { label: string; bookings: any[] }[] = [];
        
        results.forEach((item: any) => {
            // Convert booking timestamp to UK timezone date
            const bookingTimestamp = item.booking.timestamp;
            const bookingDate = new Date(bookingTimestamp);
            
            // Get UK date components
            const ukDateStr = bookingDate.toLocaleDateString('en-GB', { 
                timeZone: 'Europe/London',
                year: 'numeric',
                month: '2-digit',
                day: '2-digit'
            });
            const [day, month, year] = ukDateStr.split('/').map(Number);
            const bookingUKDate = new Date(year, month - 1, day);
            
            const diffTime = bookingUKDate.getTime() - ukToday.getTime();
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
                label = formatUKDate(bookingTimestamp);
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

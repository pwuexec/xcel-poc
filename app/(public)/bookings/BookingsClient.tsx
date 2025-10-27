"use client";

import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { Preloaded, usePaginatedQuery, usePreloadedQuery, useMutation } from "convex/react";
import { useSearchParams } from "next/navigation";
import { useSearchParamsState } from "@/hooks/useSearchParamsState";
import CreateBookingForm from "./components/CreateBookingForm";
import RescheduleBookingForm from "./components/RescheduleBookingForm";
import PaymentButton from "./components/PaymentButton";
import BookingChat from "./components/BookingChat";
import { getVideoCallUrl } from "./components/VideoCall";
import { FunctionReturnType } from "convex/server";
import { formatBookingEvent, getEventIcon } from "@/lib/formatBookingEvent";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type BookingWithUsers = FunctionReturnType<typeof api.schemas.bookings.getMyBookingsPaginated>["page"][0];

interface BookingsClientProps {
    preloadedBookings: Preloaded<typeof api.schemas.bookings.getMyBookingsPaginated>;
    initialStatus?: string;
}

export function BookingsClient({ preloadedBookings, initialStatus }: BookingsClientProps) {
    const searchParams = useSearchParams();
    const { setParam, removeParam } = useSearchParamsState();
    const statusFilter = searchParams.get("status") || initialStatus || "all";

    // Use the preloaded query result for initial render
    const preloadedData = usePreloadedQuery(preloadedBookings);

    // Use paginated query for subsequent updates and pagination
    const { results, status, loadMore } = usePaginatedQuery(
        api.schemas.bookings.getMyBookingsPaginated,
        statusFilter === "all" ? {} : { status: statusFilter as any },
        { initialNumItems: 10 }
    );

    // Use preloaded data until paginated query has loaded at least 10 items
    // This prevents unnecessary re-renders and maintains SSR benefits
    const displayResults = (results && results.length >= 10) ? results : preloadedData.page;
    const displayStatus = (results && results.length >= 10) ? status : (preloadedData.isDone ? "Exhausted" : "CanLoadMore");

    const handleStatusChange = (value: string) => {
        if (value === "all") {
            removeParam("status");
        } else {
            setParam("status", value);
        }
    };

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-4 py-8">
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Bookings
                    </h1>
                    <CreateBookingForm />
                </div>

                <Tabs value={statusFilter} onValueChange={handleStatusChange} className="mb-6">
                    <TabsList>
                        <TabsTrigger value="all">All</TabsTrigger>
                        <TabsTrigger value="pending">Pending</TabsTrigger>
                        <TabsTrigger value="awaiting_payment">Awaiting Payment</TabsTrigger>
                        <TabsTrigger value="confirmed">Confirmed</TabsTrigger>
                        <TabsTrigger value="completed">Completed</TabsTrigger>
                        <TabsTrigger value="canceled">Canceled</TabsTrigger>
                    </TabsList>
                </Tabs>

                <div className="space-y-3">
                    {displayStatus === "LoadingFirstPage" && (
                        <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-lg">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                Loading bookings...
                            </p>
                        </div>
                    )}

                    {displayResults?.length === 0 && displayStatus !== "LoadingFirstPage" && (
                        <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-lg">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                No {statusFilter !== "all" ? statusFilter.replace(/_/g, " ") : ""} bookings
                            </p>
                        </div>
                    )}

                    {displayResults?.map((item: any) => (
                        <BookingCard
                            key={item.booking._id}
                            booking={item.booking}
                            toUser={item.toUser}
                            fromUser={item.fromUser}
                            currentUser={item.currentUser}
                        />
                    ))}

                    {displayStatus === "CanLoadMore" && (
                        <div className="flex justify-center pt-4">
                            <Button
                                onClick={() => loadMore(10)}
                                variant="outline"
                                size="lg"
                            >
                                Load More
                            </Button>
                        </div>
                    )}

                    {displayStatus === "LoadingMore" && (
                        <div className="text-center py-4">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                Loading more...
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function BookingCard({ booking, toUser, fromUser, currentUser }: BookingWithUsers) {
    const [isRescheduleOpen, setIsRescheduleOpen] = useState(false);
    const [isHistoryExpanded, setIsHistoryExpanded] = useState(false);
    const acceptBooking = useMutation(api.schemas.bookings.acceptBooking);
    const rejectBooking = useMutation(api.schemas.bookings.rejectBooking);
    const cancelBooking = useMutation(api.schemas.bookings.cancelBooking);

    const statusColors: Record<string, string> = {
        pending: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400",
        awaiting_payment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        processing_payment: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400",
        confirmed: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400",
        canceled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        completed: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400",
        rejected: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400",
        awaiting_reschedule: "bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400",
    };

    const bookingDate = new Date(booking.timestamp);

    if (!toUser) {
        return null;
    }

    const isTutor = currentUser.role === "tutor";
    const otherParty = isTutor ? fromUser : toUser;
    const otherPartyName = otherParty.name || otherParty.email || "Unknown User";

    const isAwaitingReschedule = booking.status === "awaiting_reschedule";
    const currentUserIsWaiting = isAwaitingReschedule && booking.lastActionByUserId === currentUser._id;

    const canAcceptReject = (booking.status === "pending" ||
        booking.status === "awaiting_reschedule") && !currentUserIsWaiting;

    const canReschedule = booking.status !== "completed" &&
        booking.status !== "canceled" &&
        !currentUserIsWaiting;

    const canCancel = booking.status !== "completed" && booking.status !== "canceled";
    const canPay = booking.status === "awaiting_payment" && currentUser.role !== "tutor";
    const canJoinVideoCall = booking.status === "confirmed";

    const handleAccept = async () => {
        try {
            await acceptBooking({ bookingId: booking._id });
            alert("Booking accepted successfully!");
        } catch (error) {
            console.error("Failed to accept booking:", error);
            alert(error instanceof Error ? error.message : "Failed to accept booking. Please try again.");
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to reject this booking?")) {
            return;
        }
        try {
            await rejectBooking({ bookingId: booking._id });
            alert("Booking rejected successfully!");
        } catch (error) {
            console.error("Failed to reject booking:", error);
            alert(error instanceof Error ? error.message : "Failed to reject booking. Please try again.");
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) {
            return;
        }
        try {
            await cancelBooking({ bookingId: booking._id });
            alert("Booking canceled successfully!");
        } catch (error) {
            console.error("Failed to cancel booking:", error);
            alert(error instanceof Error ? error.message : "Failed to cancel booking. Please try again.");
        }
    };

    return (
        <>
            <Card className="overflow-hidden transition-shadow hover:shadow-lg border-2">
                <CardHeader className="p-5">
                    <div className="flex items-center gap-4 mb-4">
                        {otherParty.image ? (
                            <img
                                src={otherParty.image}
                                alt={otherParty.name || "User"}
                                className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-200 dark:ring-zinc-700"
                            />
                        ) : (
                            <div className="h-12 w-12 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center ring-2 ring-zinc-200 dark:ring-zinc-700">
                                <span className="text-lg font-bold text-zinc-600 dark:text-zinc-400">
                                    {otherParty.name?.[0]?.toUpperCase() || "?"}
                                </span>
                            </div>
                        )}
                        <div className="flex-1 min-w-0">
                            <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100 mb-0.5">
                                {otherParty.name || "Unknown User"}
                            </h3>
                            <p className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                                {isTutor ? "Student" : "Tutor"}
                            </p>
                        </div>
                        <Badge
                            className={statusColors[booking.status] || statusColors.pending}
                        >
                            {booking.status.replace(/_/g, " ")}
                        </Badge>
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="text-lg">��</span>
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Date</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {bookingDate.toLocaleDateString("en-GB", {
                                            weekday: "short",
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                            timeZone: "Europe/London",
                                        })}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-lg">🕐</span>
                                <div>
                                    <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase">Time</p>
                                    <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                                        {bookingDate.toLocaleTimeString("en-GB", {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                            timeZone: "Europe/London",
                                        })}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </CardHeader>

                <CardContent className="p-5 pt-0">
                    <div className="flex flex-wrap gap-2">
                        {canJoinVideoCall && (
                            <Button
                                onClick={async (e) => {
                                    e.preventDefault();
                                    try {
                                        const url = await getVideoCallUrl({
                                            bookingId: booking._id,
                                            userName: currentUser.name || currentUser.email || "User",
                                            userId: currentUser._id,
                                            userEmail: currentUser.email || "",
                                        });
                                        window.open(url, '_blank', 'noopener,noreferrer');
                                    } catch (error) {
                                        alert('Failed to join video call. Please try again.');
                                    }
                                }}
                                className="flex-1 min-w-[120px]"
                            >
                                🎥 Join Video Call
                            </Button>
                        )}

                        {canPay && (
                            <PaymentButton
                                bookingId={booking._id}
                                customerName={currentUser.name || undefined}
                                customerEmail={currentUser.email!}
                            />
                        )}

                        {canAcceptReject && (
                            <>
                                <Button
                                    onClick={handleAccept}
                                    className="flex-1 min-w-[120px] bg-green-600 hover:bg-green-700"
                                >
                                    ✓ Accept
                                </Button>
                                <Button
                                    onClick={handleReject}
                                    className="flex-1 min-w-[120px] bg-red-600 hover:bg-red-700"
                                >
                                    ✗ Reject
                                </Button>
                            </>
                        )}

                        {canReschedule && (
                            <Button
                                onClick={() => setIsRescheduleOpen(true)}
                                className="flex-1 min-w-[120px]"
                                variant="default"
                            >
                                📅 Reschedule
                            </Button>
                        )}

                        {canCancel && (
                            <Button
                                onClick={handleCancel}
                                className="flex-1 min-w-[120px]"
                                variant="outline"
                            >
                                🚫 Cancel
                            </Button>
                        )}
                    </div>
                </CardContent>

                <BookingChat
                    bookingId={booking._id}
                    currentUserId={currentUser._id}
                    otherPartyName={otherPartyName}
                />

                <Separator />
                <div>
                    <button
                        onClick={() => setIsHistoryExpanded(!isHistoryExpanded)}
                        className="w-full px-4 py-3 flex items-center justify-between hover:bg-zinc-50 dark:hover:bg-zinc-800/50 transition-colors"
                    >
                        <span className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
                            📋 View Details & History
                        </span>
                        <span className={`text-zinc-400 dark:text-zinc-500 text-sm transform transition-transform ${isHistoryExpanded ? 'rotate-180' : ''}`}>
                            ▼
                        </span>
                    </button>

                    {isHistoryExpanded && (
                        <div className="px-4 pb-4 space-y-4">
                            <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                                <p className="text-xs font-medium text-zinc-500 dark:text-zinc-400 uppercase mb-1">
                                    Booking Reference
                                </p>
                                <p className="text-sm font-mono text-zinc-900 dark:text-zinc-100 break-all">
                                    {booking._id}
                                </p>
                                <p className="text-xs text-zinc-500 dark:text-zinc-500 mt-2">
                                    Created {new Date(booking._creationTime).toLocaleDateString("en-GB", {
                                        year: "numeric",
                                        month: "long",
                                        day: "numeric",
                                        hour: "2-digit",
                                        minute: "2-digit",
                                        timeZone: "Europe/London",
                                    })}
                                </p>
                            </div>

                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                    Event History ({booking.events.length})
                                </h4>
                                <div className="space-y-2">
                                    {booking.events.map((event: any, index: number) => (
                                        <div
                                            key={index}
                                            className="flex items-start gap-3 text-sm p-3 bg-zinc-50 dark:bg-zinc-800/50 rounded-lg"
                                        >
                                            <span className="text-lg">{getEventIcon(event.type)}</span>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="font-medium text-zinc-900 dark:text-zinc-100 capitalize">
                                                        {event.type}
                                                    </span>
                                                    <span className="text-zinc-500 dark:text-zinc-500">
                                                        by {event.userName}
                                                    </span>
                                                </div>
                                                <p className="text-zinc-600 dark:text-zinc-400 mt-1">
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
                            </div>
                        </div>
                    )}
                </div>
            </Card>

            <RescheduleBookingForm
                bookingId={booking._id}
                currentTimestamp={booking.timestamp}
                isOpen={isRescheduleOpen}
                onClose={() => setIsRescheduleOpen(false)}
            />
        </>
    );
}

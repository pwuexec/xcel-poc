"use client";

import { api } from "@/convex/_generated/api";
import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import CreateBookingForm from "./components/CreateBookingForm";
import RescheduleBookingForm from "./components/RescheduleBookingForm";
import PaymentButton from "./components/PaymentButton";
import BookingChat from "./components/BookingChat";
import VideoCall from "./components/VideoCall";
import { FunctionReturnType } from "convex/server";
import { Preloaded, usePreloadedQuery, useMutation } from "convex/react";
import { formatBookingEvent, getEventIcon } from "@/lib/formatBookingEvent";

interface BookingsClientProps {
    preloadedBookings: Preloaded<typeof api.schemas.bookings.getMyBookings>;
}

export function BookingsClient({ preloadedBookings }: BookingsClientProps) {
    const bookings = usePreloadedQuery(preloadedBookings);
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const router = useRouter();
    const searchParams = useSearchParams();

    const videoCallBookingId = searchParams.get("videoCall");

    const filteredBookings = bookings?.filter((item) => {
        if (selectedStatus === "all") return true;
        return item.booking.status === selectedStatus;
    });

    // Find the booking for the video call if one is active
    const activeVideoCallBooking = videoCallBookingId
        ? bookings?.find(item => item.booking._id === videoCallBookingId)
        : null;

    return (
        <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <div className="mx-auto max-w-5xl px-4 py-8">
                {/* Header */}
                <div className="mb-8 flex justify-between items-center">
                    <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
                        Bookings
                    </h1>
                    <CreateBookingForm />
                </div>

                {/* Filter Tabs */}
                <div className="flex gap-2">
                    {["all", "awaiting_payment", "confirmed"].map((status) => (
                        <button
                            key={status}
                            onClick={() => setSelectedStatus(status)}
                            className={`px-3 py-1.5 text-sm rounded-lg whitespace-nowrap transition-colors ${selectedStatus === status
                                ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                                : "bg-white text-zinc-600 hover:bg-zinc-100 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
                                }`}
                        >
                            {status.replace(/_/g, " ")}
                        </button>
                    ))}
                </div>

                {/* Bookings List */}
                <div className="space-y-3">
                    {filteredBookings?.length === 0 ? (
                        <div className="text-center py-8 bg-white dark:bg-zinc-900 rounded-lg">
                            <p className="text-zinc-600 dark:text-zinc-400 text-sm">
                                No {selectedStatus !== "all" ? selectedStatus.replace(/_/g, " ") : ""} bookings
                            </p>
                        </div>
                    ) : (
                        filteredBookings?.map((item) => (
                            <BookingCard
                                key={item.booking._id}
                                booking={item.booking}
                                toUser={item.toUser}
                                fromUser={item.fromUser}
                                currentUser={item.currentUser}
                                onOpenVideoCall={(bookingId) => {
                                    const params = new URLSearchParams(searchParams);
                                    params.set("videoCall", bookingId);
                                    router.push(`?${params.toString()}`);
                                }}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Video Call - Rendered at top level to prevent query loops */}
            {activeVideoCallBooking && (
                <VideoCall
                    bookingId={activeVideoCallBooking.booking._id}
                    userName={activeVideoCallBooking.currentUser.name || activeVideoCallBooking.currentUser.email || "User"}
                    userId={activeVideoCallBooking.currentUser._id}
                    onClose={() => {
                        const params = new URLSearchParams(searchParams);
                        params.delete("videoCall");
                        router.push(`?${params.toString()}`);
                    }}
                />
            )}
        </div>
    );
}

function BookingCard({ booking, toUser, fromUser, currentUser, onOpenVideoCall }: FunctionReturnType<typeof api.schemas.bookings.getMyBookings>[0] & {
    onOpenVideoCall: (bookingId: string) => void;
}) {
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

    // Handle null toUser
    if (!toUser) {
        return null;
    }

    // Determine the other party (who the current user is chatting with)
    const isTutor = currentUser.role === "tutor";
    const otherParty = isTutor ? fromUser : toUser;
    const otherPartyName = otherParty.name || otherParty.email || "Unknown User";

    // Check if current user was the last to act (for reschedule awaiting confirmation)
    const isAwaitingReschedule = booking.status === "awaiting_reschedule";

    const currentUserIsWaiting = isAwaitingReschedule && booking.lastActionByUserId === currentUser._id;

    // Determine which buttons to show based on status
    const canAcceptReject = (booking.status === "pending" ||
        booking.status === "awaiting_reschedule") && !currentUserIsWaiting;

    const canReschedule = booking.status !== "completed" &&
        booking.status !== "canceled" &&
        !currentUserIsWaiting;

    const canCancel = booking.status !== "completed" && booking.status !== "canceled";

    // Everyone except tutors can pay when status is awaiting_payment
    const canPay = booking.status === "awaiting_payment" && currentUser.role !== "tutor";

    // Can join video call when booking is confirmed
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
            <div className="bg-white dark:bg-zinc-900 rounded-lg border-2 border-zinc-200 dark:border-zinc-800 overflow-hidden transition-shadow hover:shadow-lg">
                {/* Main Content - Large and Clear */}
                <div className="p-5">
                    {/* Person Info with Status Badge */}
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
                        <span
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wide whitespace-nowrap ${statusColors[booking.status] || statusColors.pending
                                }`}
                        >
                            {booking.status.replace(/_/g, " ")}
                        </span>
                    </div>

                    {/* Date & Time - Compact inline layout */}
                    <div className="bg-zinc-50 dark:bg-zinc-800/50 rounded-lg p-3">
                        <div className="flex items-center gap-4 flex-wrap">
                            <div className="flex items-center gap-2 flex-1 min-w-[200px]">
                                <span className="text-lg">📅</span>
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

                    {/* Action Buttons - Large and Clear */}
                    <div className="mt-4 flex flex-wrap gap-2">
                        {canJoinVideoCall && (
                            <button
                                onClick={() => onOpenVideoCall(booking._id)}
                                className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                🎥 Join Video Call
                            </button>
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
                                <button
                                    onClick={handleAccept}
                                    className="flex-1 min-w-[120px] px-4 py-2 bg-green-600 text-white text-sm font-bold rounded-lg hover:bg-green-700 transition-colors shadow-sm"
                                >
                                    ✓ Accept
                                </button>
                                <button
                                    onClick={handleReject}
                                    className="flex-1 min-w-[120px] px-4 py-2 bg-red-600 text-white text-sm font-bold rounded-lg hover:bg-red-700 transition-colors shadow-sm"
                                >
                                    ✗ Reject
                                </button>
                            </>
                        )}

                        {canReschedule && (
                            <button
                                onClick={() => setIsRescheduleOpen(true)}
                                className="flex-1 min-w-[120px] px-4 py-2 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                📅 Reschedule
                            </button>
                        )}

                        {canCancel && (
                            <button
                                onClick={handleCancel}
                                className="flex-1 min-w-[120px] px-4 py-2 border-2 border-red-600 text-red-600 text-sm font-bold rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                🚫 Cancel
                            </button>
                        )}
                    </div>
                </div>

                {/* Chat Messages */}
                <BookingChat
                    bookingId={booking._id}
                    currentUserId={currentUser._id}
                    otherPartyName={otherPartyName}
                />

                {/* Details Section - Collapsed by default */}
                <div className="border-t border-zinc-200 dark:border-zinc-800">
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
                            {/* Booking ID */}
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

                            {/* Event History */}
                            <div>
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mb-2">
                                    Event History ({booking.events.length})
                                </h4>
                                <div className="space-y-2">
                                    {booking.events.map((event, index) => (
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
            </div>

            <RescheduleBookingForm
                bookingId={booking._id}
                currentTimestamp={booking.timestamp}
                isOpen={isRescheduleOpen}
                onClose={() => setIsRescheduleOpen(false)}
            />
        </>
    );
}

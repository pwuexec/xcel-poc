"use client";

import { useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { BookingCardHeader } from "./BookingCardHeader";
import { BookingCardDetails } from "./BookingCardDetails";
import { BookingCardActions } from "./BookingCardActions";
import { BookingCardHistory } from "./BookingCardHistory";
import BookingChat from "./BookingChat";
import { useVideoCall } from "./VideoCall";
import { BookingEventData } from "@/lib/formatBookingEvent";

interface User {
    _id: Id<"users">;
    name?: string;
    email?: string;
    image?: string;
    role: "tutor" | "student";
}

interface Booking {
    _id: Id<"bookings">;
    fromUserId: Id<"users">;
    toUserId: Id<"users">;
    timestamp: number;
    bookingType: "free" | "paid";
    status: string;
    lastActionByUserId?: Id<"users">;
    events: BookingEventData[];
}

interface BookingCardProps {
    booking: Booking;
    toUser: User;
    fromUser: User;
    currentUser: User;
    unreadCount: number;
    onOpenDialog: (action: string, bookingId?: string) => void;
}

export function BookingCard({ 
    booking, 
    toUser, 
    fromUser, 
    currentUser, 
    unreadCount, 
    onOpenDialog 
}: BookingCardProps) {
    const { getVideoCallUrl } = useVideoCall();
    const acceptBooking = useMutation(api.bookings.integrations.writes.acceptBookingMutation);
    const rejectBooking = useMutation(api.bookings.integrations.writes.rejectBookingMutation);
    const cancelBooking = useMutation(api.bookings.integrations.writes.cancelBookingMutation);

    const isTutor = currentUser.role === "tutor";
    const otherParty = isTutor ? fromUser : toUser;
    const otherPartyName = otherParty?.name || otherParty?.email || "Unknown User";

    if (!toUser) return null;

    // Check if booking has been paid
    const paymentSucceededEvent = booking.events.find((e) => e.type === "payment_succeeded");
    const isPaid = !!paymentSucceededEvent;
    const currentUserMadeLastAction = booking.lastActionByUserId === currentUser._id;

    const handleAccept = async () => {
        try {
            await acceptBooking({ bookingId: booking._id });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to accept booking");
        }
    };

    const handleReject = async () => {
        if (!confirm("Are you sure you want to decline this booking?")) return;
        try {
            await rejectBooking({ bookingId: booking._id });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to decline booking");
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this booking?")) return;
        try {
            await cancelBooking({ bookingId: booking._id });
        } catch (error) {
            alert(error instanceof Error ? error.message : "Failed to cancel booking");
        }
    };

    const handlePayment = () => {
        onOpenDialog("payment", booking._id);
    };

    const handleJoinVideoCall = async () => {
        const launchUrl = await getVideoCallUrl({
            bookingId: booking._id,
            userName: currentUser.name || currentUser.email || "User",
            userId: currentUser._id,
            userEmail: currentUser.email || "",
        });
        window.open(launchUrl, '_blank', 'noopener,noreferrer');
    };

    return (
        <Card className="overflow-hidden hover:shadow-lg transition-all duration-200 border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <CardContent className="p-0">
                {/* Header */}
                <div className="p-6 pb-4">
                    <BookingCardHeader
                        otherPartyName={otherPartyName}
                        otherPartyImage={otherParty.image}
                        userRole={isTutor ? "tutor" : "student"}
                        status={booking.status}
                        isPaid={isPaid}
                        bookingType={booking.bookingType}
                    />

                    <BookingCardDetails
                        timestamp={booking.timestamp}
                        bookingType={booking.bookingType}
                        isPaid={isPaid}
                        paymentTimestamp={paymentSucceededEvent?.timestamp}
                    />

                    {/* Actions */}
                    <BookingCardActions
                        bookingId={booking._id}
                        bookingType={booking.bookingType}
                        status={booking.status}
                        timestamp={booking.timestamp}
                        currentUserRole={currentUser.role}
                        lastActionByCurrentUser={currentUserMadeLastAction}
                        isPaid={isPaid}
                        onAccept={handleAccept}
                        onReject={handleReject}
                        onCancel={handleCancel}
                        onPayment={handlePayment}
                        onJoinVideoCall={handleJoinVideoCall}
                    />
                </div>

                <Separator />

                {/* Chat */}
                <BookingChat
                    bookingId={booking._id}
                    currentUserId={currentUser._id}
                    otherPartyName={otherPartyName}
                    unreadCount={unreadCount}
                />

                {/* History */}
                <BookingCardHistory events={booking.events} />
            </CardContent>
        </Card>
    );
}

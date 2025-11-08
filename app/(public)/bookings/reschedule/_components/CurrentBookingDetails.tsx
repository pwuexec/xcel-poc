import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarIcon, UserIcon } from "lucide-react";
import type { Doc } from "@/convex/_generated/dataModel";

interface CurrentBookingDetailsProps {
    booking: Doc<"bookings">;
    otherUserName: string;
    isTutor: boolean;
}

export function CurrentBookingDetails({ 
    booking, 
    otherUserName,
    isTutor 
}: CurrentBookingDetailsProps) {
    const bookingDate = new Date(booking.timestamp);
    const formattedDate = bookingDate.toLocaleDateString('en-GB', {
        timeZone: 'Europe/London',
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });
    
    const formattedTime = bookingDate.toLocaleTimeString('en-GB', {
        timeZone: 'Europe/London',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
    });

    return (
        <Card className="mb-4 sm:mb-6 bg-muted/50">
            <CardHeader className="p-3 sm:p-4 pb-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                    <CalendarIcon className="size-4" />
                    Current Session
                </CardTitle>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0">
                <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                    <Badge variant="outline" className="gap-1">
                        <UserIcon className="size-3" />
                        {isTutor ? "Student" : "Tutor"}: {otherUserName}
                    </Badge>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium">{formattedDate}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-semibold">{formattedTime}</span>
                    <Badge variant={booking.bookingType === "paid" ? "default" : "secondary"}>
                        {booking.bookingType === "paid" ? "Paid" : "Free"}
                    </Badge>
                </div>
            </CardContent>
        </Card>
    );
}

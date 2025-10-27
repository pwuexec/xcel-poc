import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { BookingsClient } from "./BookingsClient";

interface BookingsPageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
    const params = await searchParams;
    const status = params.status;

    // Preload the first page of bookings
    const preloadedBookings = await preloadQuery(
        api.schemas.bookings.getMyBookingsPaginated,
        {
            paginationOpts: {
                numItems: 10,
                cursor: null,
            },
            ...(status && status !== "all" ? { status: status as any } : {}),
        },
        {
            token: await convexAuthNextjsToken(),
        }
    );

    return <BookingsClient preloadedBookings={preloadedBookings} initialStatus={status} />;
}

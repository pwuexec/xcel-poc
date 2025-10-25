import { api } from "@/convex/_generated/api";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { BookingsClient } from "./BookingsClient";

export default async function BookingsPage() {
    const preloadedBookings = await preloadQuery(
        api.schemas.bookings.getMyBookings,
        {},
        {
            token: await convexAuthNextjsToken(),
        }
    );

    return <BookingsClient preloadedBookings={preloadedBookings} />;
}

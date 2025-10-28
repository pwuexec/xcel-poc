import { BookingsClient } from "./BookingsClient";

interface BookingsPageProps {
    searchParams: Promise<{ status?: string }>;
}

export default async function BookingsPage({ searchParams }: BookingsPageProps) {
    const params = await searchParams;
    const status = params.status;

    return <BookingsClient initialStatus={status} />;
}

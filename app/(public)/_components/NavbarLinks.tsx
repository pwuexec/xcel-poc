"use client";

import Link from "next/link";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function NavbarLinks({
    preloadedCurrentUser,
}: {
    preloadedCurrentUser: Preloaded<typeof api.users.integrations.reads.getMe>;
}) {
    const currentUser = usePreloadedQuery(preloadedCurrentUser);
    const isAdmin = currentUser?.role === "admin";

    return (
        <div className="flex gap-4">
            <Link
                href="/"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
                Home
            </Link>
            <Link
                href="/bookings"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
                Bookings
            </Link>
            {isAdmin && (
                <Link
                    href="/admin"
                    className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
                >
                    Admin
                </Link>
            )}
        </div>
    );
}

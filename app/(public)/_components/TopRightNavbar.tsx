"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import Link from "next/link";

export default function TopRightNavbar({
    preloadedCurrentUser,
}: {
    preloadedCurrentUser: Preloaded<typeof api.schemas.users.getMe>;
}) {
    const currentUser = usePreloadedQuery(preloadedCurrentUser);
    const { signOut } = useAuthActions();

    // Show Sign In link if no current user
    if (!currentUser) {
        return (
            <Link
                href="/auth"
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
                Sign In
            </Link>
        );
    }

    // Show user profile and sign out
    return (
        <div className="flex items-center gap-3">
            {currentUser.image ? (
                <img
                    src={currentUser.image}
                    alt={currentUser.name || "User"}
                    className="h-8 w-8 rounded-full object-cover"
                />
            ) : (
                <div className="h-8 w-8 rounded-full bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center">
                    <span className="text-sm font-semibold text-zinc-600 dark:text-zinc-400">
                        {currentUser.name?.[0]?.toUpperCase() || "?"}
                    </span>
                </div>
            )}
            <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {currentUser.name || "User"}
            </span>
            <Link
                href="/auth"
                onClick={() => signOut()}
                className="text-sm font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-100 transition-colors"
            >
                Sign Out
            </Link>
        </div>
    );
}

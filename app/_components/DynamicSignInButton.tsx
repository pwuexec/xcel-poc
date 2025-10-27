"use client";

import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import Link from "next/link";
import { ComponentPropsWithoutRef } from "react";

interface DynamicSignInLinkProps extends Omit<ComponentPropsWithoutRef<typeof Link>, "href"> {
    preloadedCurrentUser: Preloaded<typeof api.schemas.users.getMe>;
}

export default function DynamicSignInLink({
    preloadedCurrentUser,
    ...props
}: DynamicSignInLinkProps) {
    const currentUser = usePreloadedQuery(preloadedCurrentUser);

    if (currentUser) {
        return (
            <Link {...props} href="/bookings">
                Dashboard
            </Link>
        );
    }

    return (
        <Link {...props} href="/auth">
            Sign In
        </Link>
    );
}
import { api } from "@/convex/_generated/api";
import { Preloaded, usePreloadedQuery } from "convex/react";
import { Link } from "lucide-react";

interface DynamicSignInLinkProps {
    preloadedCurrentUser: Preloaded<typeof api.schemas.users.getMe>;
}

export default function DynamicSignInLink({
    preloadedCurrentUser,
}: DynamicSignInLinkProps) {
    const currentUser = usePreloadedQuery(preloadedCurrentUser);

    if (currentUser) {
        return (
            <Link href="/bookings">
                Dashboard
            </Link>
        );
    }

    return (
        <Link href="/auth">
            Sign In
        </Link>
    );
}
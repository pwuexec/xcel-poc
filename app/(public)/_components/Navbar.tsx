import Link from "next/link";
import { preloadQuery } from "convex/nextjs";
import { convexAuthNextjsToken } from "@convex-dev/auth/nextjs/server";
import { api } from "@/convex/_generated/api";
import TopRightNavbar from "./TopRightNavbar";
import NavbarLinks from "./NavbarLinks";

export default async function Navbar() {
    const preloadedCurrentUser = await preloadQuery(
        api.schemas.users.getMe,
        {},
        { token: await convexAuthNextjsToken() }
    );

    return (
        <nav className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    <div className="flex items-center gap-8">
                        <Link href="/" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                            Xcel
                        </Link>
                        <NavbarLinks preloadedCurrentUser={preloadedCurrentUser} />
                    </div>

                    <TopRightNavbar preloadedCurrentUser={preloadedCurrentUser} />
                </div>
            </div>
        </nav>
    );
}

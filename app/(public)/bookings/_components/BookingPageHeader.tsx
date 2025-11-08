import { Button } from "@/components/ui/button";
import { ArrowLeftIcon, LucideIcon } from "lucide-react";
import Link from "next/link";

interface BookingPageHeaderProps {
    title: string;
    description?: string;
    icon?: LucideIcon;
    backHref?: string;
}

export function BookingPageHeader({ 
    title, 
    description, 
    icon: Icon,
    backHref = "/bookings"
}: BookingPageHeaderProps) {
    return (
        <div className="mb-4 sm:mb-6">
            <div className="flex items-center gap-3 mb-3">
                <Button variant="ghost" size="sm" asChild className="-ml-2 shrink-0">
                    <Link href={backHref}>
                        <ArrowLeftIcon className="size-4" />
                    </Link>
                </Button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-xl sm:text-2xl font-bold truncate">{title}</h1>
                    {description && (
                        <p className="text-xs sm:text-sm text-muted-foreground mt-0.5 truncate">
                            {description}
                        </p>
                    )}
                </div>
                {Icon && (
                    <Icon className="size-5 text-muted-foreground shrink-0" />
                )}
            </div>
        </div>
    );
}

import { Button } from "@/components/ui/button";
import Link from "next/link";

interface BookingFormActionsProps {
    isSubmitting: boolean;
    isDisabled?: boolean;
    submitLabel?: string;
    submittingLabel?: string;
    cancelHref?: string;
    cancelLabel?: string;
}

export function BookingFormActions({
    isSubmitting,
    isDisabled = false,
    submitLabel = "Submit",
    submittingLabel = "Submitting...",
    cancelHref = "/bookings",
    cancelLabel = "Cancel"
}: BookingFormActionsProps) {
    return (
        <div className="flex gap-3 pt-4">
            <Button
                type="button"
                variant="outline"
                asChild
                className="flex-1"
                disabled={isSubmitting}
            >
                <Link href={cancelHref}>{cancelLabel}</Link>
            </Button>
            <Button
                type="submit"
                className="flex-1"
                disabled={isSubmitting || isDisabled}
            >
                {isSubmitting ? submittingLabel : submitLabel}
            </Button>
        </div>
    );
}

"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";

interface PaymentButtonProps {
    bookingId: Id<"bookings">;
    amount?: number;
    customerName?: string;
    customerEmail: string;
}

export default function PaymentButton({
    bookingId,
    amount = 0,
    customerName,
    customerEmail
}: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const createCheckoutSession = useAction(api.stripeActions.createCheckoutSession); const handlePayment = async () => {
        setIsProcessing(true);
        setError(null);

        try {
            // Call Convex action to create checkout session
            const result = await createCheckoutSession({
                bookingId,
                customerName,
                customerEmail,
            });

            // Redirect to Stripe Checkout using the URL
            if (result.url) {
                window.location.href = result.url;
            } else {
                throw new Error('No checkout URL returned');
            }
        } catch (error: any) {
            console.error("Payment failed:", error);
            setError(error.message || "Payment failed. Please try again.");
            setIsProcessing(false);
        }
    };

    return (
        <div className="flex flex-col gap-2">
            <button
                onClick={handlePayment}
                disabled={isProcessing}
                className="flex-1 min-w-[120px] px-5 py-2.5 bg-blue-600 text-white text-sm font-bold rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-sm"
            >
                {isProcessing ? (
                    <>
                        <div className="h-4 w-4 animate-spin rounded-full border-2 border-solid border-white border-r-transparent"></div>
                        Processing...
                    </>
                ) : (
                    <>
                        💳 Pay Now
                    </>
                )}
            </button>
            {error && (
                <p className="text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}

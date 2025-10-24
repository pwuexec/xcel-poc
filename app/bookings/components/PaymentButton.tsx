"use client";

import { useState } from "react";
import { Id } from "@/convex/_generated/dataModel";

interface PaymentButtonProps {
    bookingId: Id<"bookings">;
    amount?: number; // Will be determined by booking details
}

export default function PaymentButton({ bookingId, amount = 0 }: PaymentButtonProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    const handlePayment = async () => {
        setIsProcessing(true);
        try {
            // TODO: Integrate with Stripe
            // 1. Create a payment intent
            // 2. Open Stripe checkout or payment modal
            // 3. Handle payment success/failure
            // 4. Update booking status to processing_payment/confirmed

            alert("Stripe integration coming soon. Booking ID: " + bookingId);

            // Placeholder for Stripe integration:
            // const response = await fetch('/api/create-payment-intent', {
            //     method: 'POST',
            //     headers: { 'Content-Type': 'application/json' },
            //     body: JSON.stringify({ bookingId, amount })
            // });
            // const { clientSecret } = await response.json();
            // // Redirect to Stripe or open modal

        } catch (error) {
            console.error("Payment failed:", error);
            alert("Payment failed. Please try again.");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
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
    );
}

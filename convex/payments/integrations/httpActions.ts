import { httpAction } from "../../_generated/server";
import { internal } from "../../_generated/api";

/**
 * Stripe Webhook Handler (HTTP Action)
 * 
 * This is a thin HTTP wrapper that:
 * 1. Handles CORS headers
 * 2. Extracts the webhook body and signature
 * 3. Delegates to the action for business logic (integrations/writes.ts)
 * 4. Formats the response for Stripe
 * 
 * Flow:
 * 1. Stripe sends webhook event to this endpoint
 * 2. We extract the body and signature
 * 3. We forward to the Node.js action (integrations/writes.ts)
 * 4. Return success response to Stripe
 */
export const handleStripeWebhook = httpAction(async (ctx, request) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return new Response(
            JSON.stringify({ error: "Missing stripe-signature header" }),
            { status: 400, headers }
        );
    }

    // Forward to Node.js action for processing
    try {
        await ctx.runAction(internal.payments.integrations.actions.processStripeWebhook, {
            body,
            signature,
        });

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers,
            }
        );
    }
});

/**
 * Handle Stripe checkout session creation (HTTP Action)
 * 
 * This is a thin HTTP wrapper that:
 * 1. Handles CORS headers
 * 2. Extracts the request body
 * 3. Delegates to the action for business logic (integrations/writes.ts)
 * 4. Returns the created checkout session info
 */
export const handleStripeCheckout = httpAction(async (ctx, request) => {
    const headers = {
        "Content-Type": "application/json",
    };

    const body = await request.json();

    try {
        const session = await ctx.runAction(internal.payments.integrations.actions.createCheckoutSession, body);
        return new Response(JSON.stringify(session), {
            status: 200,
            headers,
        });
    } catch (error: any) {
        console.error("Error creating checkout session:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers,
            }
        );
    }
})
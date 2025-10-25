import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";

// Stripe Webhook Handler (HTTP Action - no Node.js)
export const handleStripeWebhook = httpAction(async (ctx, request) => {
    const body = await request.text();
    const signature = request.headers.get("stripe-signature");

    if (!signature) {
        return new Response("Missing stripe-signature header", { status: 400 });
    }

    // Forward to Node.js action for processing
    try {
        await ctx.runAction(internal.stripeActions.processStripeWebhook, {
            body,
            signature,
        });

        return new Response(JSON.stringify({ received: true }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });
    } catch (error: any) {
        console.error("Error processing webhook:", error);
        return new Response(
            JSON.stringify({ error: error.message || "Internal server error" }),
            {
                status: 500,
                headers: { "Content-Type": "application/json" },
            }
        );
    }
});

import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleStripeWebhook } from "./payments/integrations/httpActions";

const http = httpRouter();

auth.addHttpRoutes(http);

// Stripe webhook
http.route({
    path: "/stripe/webhook",
    method: "POST",
    handler: handleStripeWebhook,
});

export default http;

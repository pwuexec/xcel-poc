import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleZegoTokenOptions, generateZegoToken } from "./zego";

const http = httpRouter();

auth.addHttpRoutes(http);

// CORS preflight
http.route({
    path: "/zego-token",
    method: "OPTIONS",
    handler: handleZegoTokenOptions,
});

// POST -> gera token04
http.route({
    path: "/zego-token",
    method: "POST",
    handler: generateZegoToken,
});

export default http;

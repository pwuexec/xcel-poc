import { httpRouter } from "convex/server";
import { auth } from "./auth";
import { handleDailyRoomOptions, createDailyRoom } from "./daily";

const http = httpRouter();

auth.addHttpRoutes(http);

// CORS preflight
http.route({
    path: "/daily-room",
    method: "OPTIONS",
    handler: handleDailyRoomOptions,
});

// POST -> create Daily.co room
http.route({
    path: "/daily-room",
    method: "POST",
    handler: createDailyRoom,
});

export default http;

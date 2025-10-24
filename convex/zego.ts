import { httpAction } from "./_generated/server";

/** ---------- CORS helpers ---------- */
function corsHeaders(origin: string | null) {
    return {
        "Access-Control-Allow-Origin": origin || "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type",
        "Access-Control-Max-Age": "86400",
        Vary: "origin",
    };
}

export const handleZegoTokenOptions = httpAction(async (_, req) => {
    const origin = req.headers.get("Origin");
    return new Response(null, { status: 204, headers: new Headers(corsHeaders(origin)) });
});

/** ---------- Token04 (AES-GCM) helpers ---------- */
enum AesEncryptMode { GCM = 1 }
const VERSION_FLAG = "04";

function makeNonce32() {
    // int32 range, like the official impl
    const min = -(2 ** 31);
    const max = 2 ** 31 - 1;
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

async function aesGcmEncryptWeb(plainText: string, keyStr: string) {
    // key must be 32 bytes (ServerSecret da Zego tem 32 chars)
    if (typeof keyStr !== "string" || keyStr.length !== 32) {
        throw new Error("ZEGO_SERVER_SECRET must be a 32-byte string");
    }

    const enc = new TextEncoder();
    const keyBytes = enc.encode(keyStr);         // 32 bytes
    const iv = crypto.getRandomValues(new Uint8Array(12)); // 12-byte nonce for GCM

    const cryptoKey = await crypto.subtle.importKey(
        "raw",
        keyBytes,
        { name: "AES-GCM" },
        false,
        ["encrypt"]
    );

    const cipherBuf = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        enc.encode(plainText)
    );

    // browser/webcrypto returns ciphertext||authTag already
    return { encryptBuf: new Uint8Array(cipherBuf), nonce: iv };
}

function packToken(expire: number, nonce: Uint8Array, encryptBuf: Uint8Array) {
    const b1 = new Uint8Array(8);
    const b2 = new Uint8Array(2);
    const b3 = new Uint8Array(2);
    const b4 = new Uint8Array(1);
    new DataView(b1.buffer).setBigInt64(0, BigInt(expire), false);
    new DataView(b2.buffer).setUint16(0, nonce.byteLength, false);
    new DataView(b3.buffer).setUint16(0, encryptBuf.byteLength, false);
    new DataView(b4.buffer).setUint8(0, AesEncryptMode.GCM);

    const total = new Uint8Array(
        b1.length + b2.length + nonce.length + b3.length + encryptBuf.length + b4.length
    );
    let o = 0;
    total.set(b1, o); o += b1.length;
    total.set(b2, o); o += b2.length;
    total.set(nonce, o); o += nonce.length;
    total.set(b3, o); o += b3.length;
    total.set(encryptBuf, o); o += encryptBuf.length;
    total.set(b4, o);

    // base64
    let binary = "";
    for (const byte of total) binary += String.fromCharCode(byte);
    return VERSION_FLAG + btoa(binary);
}

/** ---------- Public action: POST /zego-token ---------- */
export const generateZegoToken = httpAction(async (_ctx, req) => {
    const origin = req.headers.get("Origin");
    const headers = { "Content-Type": "application/json", ...corsHeaders(origin) };

    try {
        const { userId, roomId } = await req.json();

        if (!userId || !roomId) {
            return new Response(JSON.stringify({ error: "userId and roomId are required" }), {
                status: 400,
                headers,
            });
        }

        const appIdStr = process.env.ZEGO_APP_ID;
        const serverSecret = process.env.ZEGO_SERVER_SECRET; // 32 chars, sem espaços
        if (!appIdStr || !serverSecret) {
            return new Response(JSON.stringify({ error: "Missing ZEGO_APP_ID or ZEGO_SERVER_SECRET" }), {
                status: 500,
                headers,
            });
        }

        const appId = Number(appIdStr);
        if (!Number.isFinite(appId)) {
            return new Response(JSON.stringify({ error: "ZEGO_APP_ID must be a number" }), {
                status: 500,
                headers,
            });
        }

        const now = Math.floor(Date.now() / 1000);
        const effective = 60 * 60; // 1h
        const tokenInfo = {
            app_id: appId,
            user_id: String(userId),
            nonce: makeNonce32(),
            ctime: now,
            expire: now + effective,
            payload: "",
        };

        const plain = JSON.stringify(tokenInfo);
        const { encryptBuf, nonce } = await aesGcmEncryptWeb(plain, serverSecret);
        const token = packToken(tokenInfo.expire, nonce, encryptBuf);

        return new Response(JSON.stringify({ token, appID: appId }), { status: 200, headers });
    } catch (e) {
        console.error("ZEGO token error:", e);
        return new Response(JSON.stringify({ error: "Failed to generate token" }), {
            status: 500,
            headers,
        });
    }
});

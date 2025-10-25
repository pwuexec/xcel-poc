import crypto from "crypto";

// Secret key for encryption (should be in environment variables in production)
const ENCRYPTION_KEY = process.env.WHITEBOARD_TOKEN_SECRET || "your-32-char-secret-key-here!!";
const IV_LENGTH = 16;

// Ensure the key is exactly 32 bytes for AES-256
const getKey = () => {
    const hash = crypto.createHash("sha256");
    hash.update(ENCRYPTION_KEY);
    return hash.digest();
};

export interface WhiteboardTokenPayload {
    userId: string;
    bookingId: string;
    userName: string;
    exp: number; // Expiration timestamp
}

export function encryptWhiteboardToken(payload: Omit<WhiteboardTokenPayload, "exp">): string {
    const key = getKey();
    const iv = crypto.randomBytes(IV_LENGTH);

    // Add expiration (2 minutes from now)
    const fullPayload: WhiteboardTokenPayload = {
        ...payload,
        exp: Date.now() + 2 * 60 * 1000,
    };

    const cipher = crypto.createCipheriv("aes-256-cbc", key, iv);
    const jsonPayload = JSON.stringify(fullPayload);

    let encrypted = cipher.update(jsonPayload, "utf8", "hex");
    encrypted += cipher.final("hex");

    // Combine IV and encrypted data
    const combined = iv.toString("hex") + ":" + encrypted;

    // Return as URL-safe base64
    return Buffer.from(combined).toString("base64url");
}

export function decryptWhiteboardToken(token: string): WhiteboardTokenPayload {
    try {
        const key = getKey();

        // Decode from URL-safe base64
        const combined = Buffer.from(token, "base64url").toString("utf8");
        const [ivHex, encryptedHex] = combined.split(":");

        if (!ivHex || !encryptedHex) {
            throw new Error("Invalid token format");
        }

        const iv = Buffer.from(ivHex, "hex");
        const decipher = crypto.createDecipheriv("aes-256-cbc", key, iv);

        let decrypted = decipher.update(encryptedHex, "hex", "utf8");
        decrypted += decipher.final("utf8");

        const payload = JSON.parse(decrypted) as WhiteboardTokenPayload;

        // Check expiration
        if (Date.now() > payload.exp) {
            throw new Error("Token expired");
        }

        return payload;
    } catch (error) {
        throw new Error("Invalid or expired token");
    }
}

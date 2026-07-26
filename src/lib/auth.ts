const encoder = new TextEncoder();

export const SESSION_COOKIE = "it_session";
const SESSION_PAYLOAD = "interview-tracker:v1";

function toHex(buffer: ArrayBuffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Length-independent equality so a comparison never leaks via early exit. */
function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function requireSecret() {
  const secret = process.env.AUTH_SECRET;
  if (!secret) throw new Error("AUTH_SECRET is not set.");
  return secret;
}

/**
 * The cookie holds an HMAC of a fixed payload rather than the password itself,
 * so a stolen cookie never reveals the password and cannot be forged without
 * AUTH_SECRET. Rotating AUTH_SECRET invalidates every existing session.
 */
export async function createSessionToken() {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(requireSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign(
    "HMAC",
    key,
    encoder.encode(SESSION_PAYLOAD),
  );
  return toHex(signature);
}

export async function isValidSessionToken(token: string | undefined) {
  if (!token) return false;
  return safeEqual(token, await createSessionToken());
}

export function isCorrectPassword(submitted: string) {
  const expected = process.env.APP_PASSWORD;
  if (!expected) throw new Error("APP_PASSWORD is not set.");
  return safeEqual(submitted, expected);
}

export const SESSION_MAX_AGE = 60 * 60 * 24 * 30;

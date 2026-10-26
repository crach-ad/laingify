// HMAC-signed tokens for the session cookies and the Letter Leaper practice
// ticket. A token is "v1.<base64url JSON>.<base64url HMAC>"; the purpose is
// part of the MAC so a token minted for one use can't be replayed as another.
//
// Key: SESSION_SECRET. Until that is set in an environment, the key is derived
// from DATABASE_URL — also a server-only secret — so a deploy without the new
// variable keeps working instead of locking everyone out. Rotating either
// value signs everyone out once.

import { createHash, createHmac, timingSafeEqual } from "node:crypto";

function key(): string {
  if (process.env.SESSION_SECRET) return process.env.SESSION_SECRET;
  if (process.env.DATABASE_URL) {
    return createHash("sha256").update(`laingify-session:${process.env.DATABASE_URL}`).digest("hex");
  }
  throw new Error("SESSION_SECRET (or DATABASE_URL) must be set to sign sessions.");
}

const mac = (purpose: string, body: string) =>
  createHmac("sha256", key()).update(`${purpose}.${body}`).digest("base64url");

export function signToken(purpose: string, payload: object): string {
  const body = Buffer.from(JSON.stringify(payload)).toString("base64url");
  return `v1.${body}.${mac(purpose, body)}`;
}

export function verifyToken<T>(purpose: string, token: string | undefined | null): T | null {
  if (!token || token.length > 4096) return null;
  const [version, body, sig] = token.split(".");
  if (version !== "v1" || !body || !sig) return null;
  const expected = Buffer.from(mac(purpose, body));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? (parsed as T) : null;
  } catch {
    return null;
  }
}

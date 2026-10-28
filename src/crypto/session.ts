import { cookies } from "next/headers";

import { publicUrl, sessionMaxAgeSeconds, sessionSecret } from "@/config";

import type { Keys } from "./keys";
import {
  decodeSession,
  encodeSession,
  nowSeconds,
  sessionCookieName,
  sessionCookieOptions,
} from "./sessionCodec";

/**
 * Sets the session cookie. Callers unlock the keys first (`signIn` in `src/models/user.ts`):
 * nothing session-related is stored on the server.
 */
export async function createSession(keys: Keys): Promise<void> {
  (await cookies()).set(
    sessionCookieName,
    encodeSession(keys, sessionSecret, nowSeconds(), sessionMaxAgeSeconds),
    sessionCookieOptions(publicUrl, sessionMaxAgeSeconds),
  );
}

/** The session's keys, or null when signed out, expired or tampered with. */
export async function readSession(): Promise<Keys | null> {
  const cookie = (await cookies()).get(sessionCookieName)?.value;
  return decodeSession(cookie, sessionSecret, nowSeconds())?.keys ?? null;
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(sessionCookieName);
}

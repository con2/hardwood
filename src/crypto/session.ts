import { cookies } from "next/headers";

import {
  publicUrl,
  sessionAbsoluteMaxAgeSeconds,
  sessionMaxAgeSeconds,
  sessionSecret,
} from "@/config";

import {
  decodeSession,
  encodeSession,
  nowSeconds,
  sessionCookieName,
  sessionCookieOptions,
  type Session,
  type SessionContent,
} from "./sessionCodec";

/**
 * Sets the session cookie. Callers unlock the keys first (`signIn` in `src/models/user.ts`):
 * nothing session-related is stored on the server.
 */
export async function createSession(content: SessionContent): Promise<void> {
  (await cookies()).set(
    sessionCookieName,
    encodeSession(content, sessionSecret, nowSeconds(), sessionMaxAgeSeconds),
    sessionCookieOptions(publicUrl, sessionMaxAgeSeconds),
  );
}

/** The session, or null when signed out, expired or tampered with. */
export async function readSession(): Promise<Session | null> {
  const cookie = (await cookies()).get(sessionCookieName)?.value;
  return decodeSession(
    cookie,
    sessionSecret,
    nowSeconds(),
    sessionAbsoluteMaxAgeSeconds,
  );
}

export async function destroySession(): Promise<void> {
  (await cookies()).delete(sessionCookieName);
}

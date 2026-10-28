/**
 * Pure encoding of the session cookie, shared by `session.ts` (server components and actions)
 * and `src/proxy.ts`. No next/headers here so it is unit-testable and proxy-safe.
 */
import {
  createCipheriv,
  createDecipheriv,
  hkdfSync,
  randomBytes,
} from "node:crypto";

import type { Keys } from "./keys";
import { fromBase64Url, toBase64Url } from "./primitives";

export const sessionCookieName = "hardwood_session";

const version = 1;
const nonceLength = 12;
const tagLength = 16;
const aad = Buffer.from("hardwood-session", "utf8");

export interface SessionPayload {
  v: 1;
  userId: string;
  privateKey: string;
  inviteeKey: string;
  gmKey: string | null;
  /** Seconds since the epoch. */
  issuedAt: number;
  expiresAt: number;
}

export interface Session {
  keys: Keys;
  issuedAt: number;
  expiresAt: number;
}

export function nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

function sessionKey(secret: string): Buffer {
  return Buffer.from(hkdfSync("sha256", secret, "", "hardwood-session", 32));
}

export function encodeSession(
  keys: Keys,
  secret: string,
  issuedAt: number,
  maxAgeSeconds: number,
): string {
  const payload: SessionPayload = {
    v: version,
    userId: keys.userId,
    privateKey: toBase64Url(keys.privateKey),
    inviteeKey: toBase64Url(keys.inviteeKey),
    gmKey: keys.gmKey ? toBase64Url(keys.gmKey) : null,
    issuedAt,
    expiresAt: issuedAt + maxAgeSeconds,
  };
  const nonce = randomBytes(nonceLength);
  const cipher = createCipheriv("aes-256-gcm", sessionKey(secret), nonce);
  cipher.setAAD(aad);
  const ciphertext = Buffer.concat([
    cipher.update(JSON.stringify(payload), "utf8"),
    cipher.final(),
  ]);
  return toBase64Url(
    Buffer.concat([Buffer.of(version), nonce, ciphertext, cipher.getAuthTag()]),
  );
}

/** Returns null for anything that is not a valid, unexpired session. Never throws. */
export function decodeSession(
  cookie: string | undefined,
  secret: string,
  now: number,
): Session | null {
  if (!cookie) return null;
  try {
    const bytes = fromBase64Url(cookie);
    if (bytes.length < 1 + nonceLength + tagLength || bytes[0] !== version) {
      return null;
    }
    const nonce = bytes.subarray(1, 1 + nonceLength);
    const tag = bytes.subarray(bytes.length - tagLength);
    const ciphertext = bytes.subarray(
      1 + nonceLength,
      bytes.length - tagLength,
    );
    const decipher = createDecipheriv("aes-256-gcm", sessionKey(secret), nonce);
    decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    const payload = JSON.parse(
      Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString(
        "utf8",
      ),
    ) as SessionPayload;
    if (payload.v !== version || payload.expiresAt <= now) return null;
    return {
      keys: {
        userId: payload.userId,
        privateKey: fromBase64Url(payload.privateKey),
        inviteeKey: fromBase64Url(payload.inviteeKey),
        gmKey: payload.gmKey ? fromBase64Url(payload.gmKey) : null,
      },
      issuedAt: payload.issuedAt,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

export function isStale(
  session: Session,
  now: number,
  refreshAfterSeconds: number,
): boolean {
  return now - session.issuedAt >= refreshAfterSeconds;
}

export function sessionCookieOptions(publicUrl: string, maxAgeSeconds: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    path: "/",
    secure: publicUrl.startsWith("https"),
    maxAge: maxAgeSeconds,
  };
}

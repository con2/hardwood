import { createCipheriv, hkdfSync, randomBytes } from "node:crypto";

import { describe, expect, it } from "vitest";

import {
  fromBase64Url,
  generateKeyPair,
  randomKey,
  toBase64Url,
} from "./primitives";
import { decodeSession, encodeSession, isStale } from "./sessionCodec";

const secret = "test-secret";
const keys = {
  userId: "00000000-0000-4000-8000-000000000000",
  privateKey: generateKeyPair().privateKey,
  inviteeKey: randomKey(),
  gmKey: null,
};
const content = { keys, authenticatedAt: 1000, epoch: 3 };
const absoluteMaxAge = 7 * 24 * 3600;

describe("session cookie", () => {
  it("round-trips the keys", () => {
    const cookie = encodeSession(content, secret, 1000, 3600);
    const session = decodeSession(cookie, secret, 1001, absoluteMaxAge);
    expect(session).not.toBeNull();
    expect(session!.keys.userId).toBe(keys.userId);
    expect(
      Buffer.from(session!.keys.privateKey).equals(
        Buffer.from(keys.privateKey),
      ),
    ).toBe(true);
    expect(
      Buffer.from(session!.keys.inviteeKey).equals(
        Buffer.from(keys.inviteeKey),
      ),
    ).toBe(true);
    expect(session!.keys.gmKey).toBeNull();
    expect(session!.authenticatedAt).toBe(1000);
    expect(session!.epoch).toBe(3);
    expect(session!.issuedAt).toBe(1000);
    expect(session!.expiresAt).toBe(4600);
  });

  it("carries the GM key", () => {
    const gmKey = randomKey();
    const session = decodeSession(
      encodeSession(
        { ...content, keys: { ...keys, gmKey } },
        secret,
        1000,
        3600,
      ),
      secret,
      1000,
      absoluteMaxAge,
    );
    expect(Buffer.from(session!.keys.gmKey!).equals(Buffer.from(gmKey))).toBe(
      true,
    );
  });

  it("rejects expired sessions", () => {
    const cookie = encodeSession(content, secret, 1000, 3600);
    expect(decodeSession(cookie, secret, 4600, absoluteMaxAge)).toBeNull();
  });

  it("expires a week after sign-in however often it is refreshed", () => {
    const refreshedAt = 1000 + absoluteMaxAge - 60;
    const cookie = encodeSession(content, secret, refreshedAt, 3600);
    expect(
      decodeSession(cookie, secret, refreshedAt + 59, absoluteMaxAge),
    ).not.toBeNull();
    expect(
      decodeSession(cookie, secret, refreshedAt + 60, absoluteMaxAge),
    ).toBeNull();
  });

  it("keeps the sign-in time and epoch when refreshed", () => {
    const first = decodeSession(
      encodeSession(content, secret, 1000, 3600),
      secret,
      2800,
      absoluteMaxAge,
    )!;
    const refreshed = decodeSession(
      encodeSession(first, secret, 2800, 3600),
      secret,
      2801,
      absoluteMaxAge,
    )!;
    expect(refreshed.issuedAt).toBe(2800);
    expect(refreshed.authenticatedAt).toBe(1000);
    expect(refreshed.epoch).toBe(3);
  });

  it("rejects version 1 cookies", () => {
    // A version 1 cookie: same framing and key, payload without authenticatedAt or epoch.
    const nonce = randomBytes(12);
    const cipher = createCipheriv(
      "aes-256-gcm",
      Buffer.from(hkdfSync("sha256", secret, "", "hardwood-session", 32)),
      nonce,
    );
    cipher.setAAD(Buffer.from("hardwood-session", "utf8"));
    const payload = {
      v: 1,
      userId: keys.userId,
      privateKey: toBase64Url(keys.privateKey),
      inviteeKey: toBase64Url(keys.inviteeKey),
      gmKey: null,
      issuedAt: 1000,
      expiresAt: 4600,
    };
    const ciphertext = Buffer.concat([
      cipher.update(JSON.stringify(payload), "utf8"),
      cipher.final(),
    ]);
    const cookie = toBase64Url(
      Buffer.concat([Buffer.of(1), nonce, ciphertext, cipher.getAuthTag()]),
    );
    expect(decodeSession(cookie, secret, 1001, absoluteMaxAge)).toBeNull();
  });

  it("rejects another secret, tampering and garbage", () => {
    const cookie = encodeSession(content, secret, 1000, 3600);
    expect(
      decodeSession(cookie, "other-secret", 1001, absoluteMaxAge),
    ).toBeNull();
    const bytes = fromBase64Url(cookie);
    bytes[20] ^= 1;
    expect(
      decodeSession(toBase64Url(bytes), secret, 1001, absoluteMaxAge),
    ).toBeNull();
    expect(decodeSession("garbage", secret, 1001, absoluteMaxAge)).toBeNull();
    expect(decodeSession(undefined, secret, 1001, absoluteMaxAge)).toBeNull();
  });

  it("is stale after the refresh threshold", () => {
    const session = decodeSession(
      encodeSession(content, secret, 1000, 3600),
      secret,
      1000,
      absoluteMaxAge,
    )!;
    expect(isStale(session, 1000 + 1799, 1800)).toBe(false);
    expect(isStale(session, 1000 + 1800, 1800)).toBe(true);
  });
});

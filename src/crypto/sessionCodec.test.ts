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

describe("session cookie", () => {
  it("round-trips the keys", () => {
    const cookie = encodeSession(keys, secret, 1000, 3600);
    const session = decodeSession(cookie, secret, 1001);
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
    expect(session!.issuedAt).toBe(1000);
    expect(session!.expiresAt).toBe(4600);
  });

  it("carries the GM key", () => {
    const gmKey = randomKey();
    const session = decodeSession(
      encodeSession({ ...keys, gmKey }, secret, 1000, 3600),
      secret,
      1000,
    );
    expect(Buffer.from(session!.keys.gmKey!).equals(Buffer.from(gmKey))).toBe(
      true,
    );
  });

  it("rejects expired sessions", () => {
    const cookie = encodeSession(keys, secret, 1000, 3600);
    expect(decodeSession(cookie, secret, 4600)).toBeNull();
  });

  it("rejects another secret, tampering and garbage", () => {
    const cookie = encodeSession(keys, secret, 1000, 3600);
    expect(decodeSession(cookie, "other-secret", 1001)).toBeNull();
    const bytes = fromBase64Url(cookie);
    bytes[20] ^= 1;
    expect(decodeSession(toBase64Url(bytes), secret, 1001)).toBeNull();
    expect(decodeSession("garbage", secret, 1001)).toBeNull();
    expect(decodeSession(undefined, secret, 1001)).toBeNull();
  });

  it("is stale after the refresh threshold", () => {
    const session = decodeSession(
      encodeSession(keys, secret, 1000, 3600),
      secret,
      1000,
    )!;
    expect(isStale(session, 1000 + 1799, 1800)).toBe(false);
    expect(isStale(session, 1000 + 1800, 1800)).toBe(true);
  });
});

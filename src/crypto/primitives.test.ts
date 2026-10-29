import { describe, expect, it } from "vitest";

import {
  blobVersion,
  DecryptionError,
  decryptJson,
  defaultKdfParams,
  deriveKek,
  encryptJson,
  formatVersion,
  fromBase64Url,
  generateInitialPassword,
  generateKeyPair,
  generateSalt,
  hashToken,
  initialPasswordPattern,
  open,
  publicKeyFromPrivate,
  randomKey,
  randomToken,
  recordFormatVersion,
  seal,
  toBase64Url,
  unwrap,
  wrap,
  type KdfParams,
  maxConcurrentKdf,
} from "./primitives";

/** Flips one bit in the middle of an encoded blob. */
function tamper(blob: string): string {
  const bytes = fromBase64Url(blob);
  const i = Math.floor(bytes.length / 2);
  bytes[i] ^= 0x01;
  return toBase64Url(bytes);
}

const cheapArgon2: KdfParams = {
  algorithm: "argon2id",
  memory: 1024,
  passes: 1,
  parallelism: 1,
};

describe("deriveKek", () => {
  it("derives a stable 32-byte key with the default Argon2id parameters", async () => {
    const salt = generateSalt();
    const a = await deriveKek("correct horse", salt, defaultKdfParams, "pep");
    const b = await deriveKek("correct horse", salt, defaultKdfParams, "pep");
    expect(a.length).toBe(32);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
  });

  it("depends on the password and the salt", async () => {
    const salt = generateSalt();
    const a = await deriveKek("correct horse", salt, cheapArgon2);
    const b = await deriveKek("correct horsf", salt, cheapArgon2);
    const c = await deriveKek("correct horse", generateSalt(), cheapArgon2);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(false);
    expect(Buffer.from(a).equals(Buffer.from(c))).toBe(false);
  });

  it("depends on the pepper when peppered", async () => {
    const salt = generateSalt();
    const peppered: KdfParams = { ...cheapArgon2, peppered: true };
    const a = await deriveKek("correct horse", salt, peppered, "pepper");
    const b = await deriveKek("correct horse", salt, peppered, "pepper");
    const wrong = await deriveKek("correct horse", salt, peppered, "salt");
    const unpeppered = await deriveKek("correct horse", salt, cheapArgon2);
    expect(Buffer.from(a).equals(Buffer.from(b))).toBe(true);
    expect(Buffer.from(a).equals(Buffer.from(wrong))).toBe(false);
    expect(Buffer.from(a).equals(Buffer.from(unpeppered))).toBe(false);
    await expect(deriveKek("correct horse", salt, peppered)).rejects.toThrow();
  });

  it("queues derivations beyond the concurrency limit and completes them all", async () => {
    const salt = generateSalt();
    const keys = await Promise.all(
      Array.from({ length: maxConcurrentKdf * 3 }, (_, i) =>
        deriveKek(`pw${i}`, salt, cheapArgon2),
      ),
    );
    expect(new Set(keys.map((k) => Buffer.from(k).toString("hex"))).size).toBe(
      keys.length,
    );
  });

  it("supports scrypt as a fallback", async () => {
    const key = await deriveKek("pw", generateSalt(), {
      algorithm: "scrypt",
      N: 1024,
      r: 8,
      p: 1,
    });
    expect(key.length).toBe(32);
  });
});

describe("wrap", () => {
  it("round-trips a key", () => {
    const kek = randomKey();
    const key = randomKey();
    const wrapped = wrap(key, kek);
    expect(fromBase64Url(wrapped)[0]).toBe(formatVersion);
    expect(Buffer.from(unwrap(wrapped, kek)).equals(Buffer.from(key))).toBe(
      true,
    );
  });

  it("fails with the wrong key or when tampered with", () => {
    const kek = randomKey();
    const wrapped = wrap(randomKey(), kek);
    expect(() => unwrap(wrapped, randomKey())).toThrow(DecryptionError);
    expect(() => unwrap(tamper(wrapped), kek)).toThrow(DecryptionError);
  });

  it("binds the wrap to its aad", () => {
    const kek = randomKey();
    const key = randomKey();
    const wrapped = wrap(key, kek, "user-1");
    expect(
      Buffer.from(unwrap(wrapped, kek, "user-1")).equals(Buffer.from(key)),
    ).toBe(true);
    expect(() => unwrap(wrapped, kek, "user-2")).toThrow(DecryptionError);
    expect(() => unwrap(wrapped, kek)).toThrow(DecryptionError);
    expect(() => unwrap(wrap(key, kek), kek, "user-1")).toThrow(
      DecryptionError,
    );
  });

  it("detects a wrong password through the GCM tag", async () => {
    const salt = generateSalt();
    const { privateKey } = generateKeyPair();
    const wrapped = wrap(
      privateKey,
      await deriveKek("right", salt, cheapArgon2),
    );
    const wrongKek = await deriveKek("wrong", salt, cheapArgon2);
    expect(() => unwrap(wrapped, wrongKek)).toThrow(DecryptionError);
  });

  it("rejects an unknown format version", () => {
    const kek = randomKey();
    const bytes = fromBase64Url(wrap(randomKey(), kek));
    bytes[0] = 0x02;
    expect(() => unwrap(toBase64Url(bytes), kek)).toThrow(DecryptionError);
  });
});

describe("seal", () => {
  it("round-trips to the recipient", () => {
    const { publicKey, privateKey } = generateKeyPair();
    const secret = randomKey();
    const sealed = seal(secret, publicKey);
    expect(
      Buffer.from(open(sealed, privateKey)).equals(Buffer.from(secret)),
    ).toBe(true);
  });

  it("fails for another recipient or when tampered with", () => {
    const recipient = generateKeyPair();
    const other = generateKeyPair();
    const sealed = seal(randomKey(), recipient.publicKey);
    expect(() => open(sealed, other.privateKey)).toThrow(DecryptionError);
    expect(() => open(tamper(sealed), recipient.privateKey)).toThrow(
      DecryptionError,
    );
  });

  it("derives the public key from the private key", () => {
    const { publicKey, privateKey } = generateKeyPair();
    expect(
      Buffer.from(publicKeyFromPrivate(privateKey)).equals(
        Buffer.from(publicKey),
      ),
    ).toBe(true);
  });
});

describe("encryptJson", () => {
  const value = { values: { name: "Äijä", list: [1, 2] }, completed: true };

  it("round-trips JSON", () => {
    const key = randomKey();
    expect(decryptJson(encryptJson(value, key, "row-1"), key, "row-1")).toEqual(
      value,
    );
  });

  it("fails with the wrong aad, key or when tampered with", () => {
    const key = randomKey();
    const blob = encryptJson(value, key, "row-1");
    expect(() => decryptJson(blob, key, "row-2")).toThrow(DecryptionError);
    expect(() => decryptJson(blob, randomKey(), "row-1")).toThrow(
      DecryptionError,
    );
    expect(() => decryptJson(tamper(blob), key, "row-1")).toThrow(
      DecryptionError,
    );
  });
});

describe("encryptJson padding", () => {
  const flags = (slugs: string[]) => ({
    flags: Object.fromEntries(
      slugs.map((slug, i) => [`0000000${i}-0000-4000-8000-000000000000`, slug]),
    ),
    completed: true,
  });

  it("hides how many flags were set and their colours", () => {
    const key = randomKey();
    const oneRed = encryptJson(flags(["red"]), key, "row-1");
    const sixGreen = encryptJson(flags(Array(6).fill("green")), key, "row-1");
    expect(oneRed.length).toBe(sixGreen.length);
    expect(decryptJson(oneRed, key, "row-1")).toEqual(flags(["red"]));
  });

  it("pads to the next multiple of the block size", () => {
    const key = randomKey();
    const overhead = 1 + 12 + 16;
    const length = (blob: string) => fromBase64Url(blob).length - overhead;
    expect(length(encryptJson("x".repeat(10), key, "a", 64))).toBe(64);
    expect(length(encryptJson("x".repeat(62), key, "a", 64))).toBe(64);
    expect(length(encryptJson("x".repeat(63), key, "a", 64))).toBe(128);
    expect(
      decryptJson(encryptJson("x".repeat(63), key, "a", 64), key, "a"),
    ).toBe("x".repeat(63));
  });
});

describe("encryptJson with a record identity", () => {
  const identity = { id: "row-1", kind: "FLAGS", ownerId: "user-1" };

  it("binds the ciphertext to id, kind and owner", () => {
    const key = randomKey();
    const blob = encryptJson({ a: 1 }, key, identity);
    expect(blobVersion(blob)).toBe(recordFormatVersion);
    expect(decryptJson(blob, key, identity)).toEqual({ a: 1 });
    for (const changed of [
      { ...identity, id: "row-2" },
      { ...identity, kind: "CASTING_RESULT" },
      { ...identity, ownerId: "user-2" },
    ]) {
      expect(() => decryptJson(blob, key, changed)).toThrow(DecryptionError);
    }
    expect(() => decryptJson(blob, key, "row-1")).toThrow(DecryptionError);
  });
});

describe("tokens and passwords", () => {
  it("generates 32-byte tokens and hashes them", () => {
    const token = randomToken();
    expect(fromBase64Url(token).length).toBe(32);
    expect(hashToken(token)).toBe(hashToken(token));
    expect(hashToken(token)).not.toBe(hashToken(randomToken()));
    expect(fromBase64Url(hashToken(token)).length).toBe(32);
  });

  it("generates typeable initial passwords", () => {
    const seen = new Set<string>();
    for (let i = 0; i < 100; i++) {
      const password = generateInitialPassword();
      expect(password).toMatch(initialPasswordPattern);
      expect(password).not.toMatch(/[01ilo]/);
      seen.add(password);
    }
    expect(seen.size).toBe(100);
  });
});

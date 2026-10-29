/**
 * Thin wrappers over Node's built-in crypto. Every encoded blob is base64url text whose first
 * byte is the format version, so algorithms can be rotated later without guessing.
 *
 * Nothing here logs, and errors never carry key material or plaintext.
 */
import {
  argon2,
  createCipheriv,
  createDecipheriv,
  createHash,
  createHmac,
  createPrivateKey,
  createPublicKey,
  diffieHellman,
  generateKeyPairSync,
  hkdfSync,
  randomBytes,
  randomInt,
  scrypt,
  timingSafeEqual,
  type KeyObject,
} from "node:crypto";

export const formatVersion = 0x01;
/**
 * Encrypted records whose aad is the record identity (`RecordIdentity`) rather than the row id
 * alone, and which carry an authenticator (`src/crypto/records.ts`).
 */
export const recordFormatVersion = 0x02;

const keyLength = 32;
const nonceLength = 12;
const tagLength = 16;
const sealInfo = "hardwood-seal-v1";

/** Thrown when a ciphertext cannot be decrypted: wrong key, wrong aad, or tampering. */
export class DecryptionError extends Error {
  constructor() {
    super("Decryption failed");
    this.name = "DecryptionError";
  }
}

// ---------------------------------------------------------------------------------------------
// Encoding

export function toBase64Url(bytes: Uint8Array): string {
  return Buffer.from(bytes).toString("base64url");
}

export function fromBase64Url(text: string): Buffer {
  return Buffer.from(text, "base64url");
}

function encodeBlob(version: number, ...parts: Uint8Array[]): string {
  return toBase64Url(Buffer.concat([Buffer.of(version), ...parts]));
}

function decodeBlob(blob: string, minLength: number, version: number): Buffer {
  const bytes = fromBase64Url(blob);
  if (bytes.length < 1 + minLength || bytes[0] !== version) {
    throw new DecryptionError();
  }
  return bytes.subarray(1);
}

/** The format version byte of an encoded blob. */
export function blobVersion(blob: string): number {
  const bytes = fromBase64Url(blob);
  if (bytes.length === 0) throw new DecryptionError();
  return bytes[0];
}

// ---------------------------------------------------------------------------------------------
// Random material

/** 32 random bytes: audience keys, data keys, the recovery key. */
export function randomKey(): Uint8Array {
  return randomBytes(keyLength);
}

/** 32 random bytes as base64url: invitation tokens. */
export function randomToken(): string {
  return toBase64Url(randomBytes(32));
}

/** Only the hash of an invitation token is stored. */
export function hashToken(token: string): string {
  return createHash("sha256").update(token, "utf8").digest("base64url");
}

/** No 0/o, 1/i/l: the password is typed by hand from a Discord message. */
const passwordAlphabet = "abcdefghjkmnpqrstuvwxyz23456789";

/** Four hyphen-separated groups of four characters, about 79 bits of entropy. */
export function generateInitialPassword(): string {
  const groups: string[] = [];
  for (let g = 0; g < 4; g++) {
    let group = "";
    for (let i = 0; i < 4; i++) {
      group += passwordAlphabet[randomInt(passwordAlphabet.length)];
    }
    groups.push(group);
  }
  return groups.join("-");
}

export const initialPasswordPattern =
  /^[a-hjkmnp-z2-9]{4}(-[a-hjkmnp-z2-9]{4}){3}$/;

// ---------------------------------------------------------------------------------------------
// Password → key encryption key

export type KdfParams =
  | {
      algorithm: "argon2id";
      /** KiB */
      memory: number;
      passes: number;
      parallelism: number;
    }
  | {
      algorithm: "scrypt";
      N: number;
      r: number;
      p: number;
    };

/** OWASP's first Argon2id recommendation is 19 MiB × 2; we can afford more for ~60 users. */
export const defaultKdfParams: KdfParams = {
  algorithm: "argon2id",
  memory: 64 * 1024,
  passes: 3,
  parallelism: 1,
};

export function generateSalt(): Uint8Array {
  return randomBytes(16);
}

export function isKdfParams(value: unknown): value is KdfParams {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  if (v.algorithm === "argon2id") {
    return (
      typeof v.memory === "number" &&
      typeof v.passes === "number" &&
      typeof v.parallelism === "number"
    );
  }
  if (v.algorithm === "scrypt") {
    return (
      typeof v.N === "number" &&
      typeof v.r === "number" &&
      typeof v.p === "number"
    );
  }
  return false;
}

/**
 * Argon2id with the default parameters holds 64 MiB for about 100 ms. A burst of sign-in attempts
 * must not multiply that past the pod's memory limit, so derivations queue behind this many slots.
 */
export const maxConcurrentKdf = 2;
let activeKdf = 0;
const kdfWaiters: (() => void)[] = [];

async function withKdfSlot<T>(fn: () => Promise<T>): Promise<T> {
  if (activeKdf >= maxConcurrentKdf) {
    await new Promise<void>((resolve) => kdfWaiters.push(resolve));
  }
  activeKdf++;
  try {
    return await fn();
  } finally {
    activeKdf--;
    kdfWaiters.shift()?.();
  }
}

export function deriveKek(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  return withKdfSlot(() => deriveKekNow(password, salt, params));
}

function deriveKekNow(
  password: string,
  salt: Uint8Array,
  params: KdfParams,
): Promise<Uint8Array> {
  return new Promise((resolve, reject) => {
    switch (params.algorithm) {
      case "argon2id":
        argon2(
          "argon2id",
          {
            message: Buffer.from(password, "utf8"),
            nonce: salt,
            memory: params.memory,
            passes: params.passes,
            parallelism: params.parallelism,
            tagLength: keyLength,
          },
          (err, key) => (err ? reject(err) : resolve(key)),
        );
        return;
      case "scrypt":
        scrypt(
          Buffer.from(password, "utf8"),
          salt,
          keyLength,
          {
            N: params.N,
            r: params.r,
            p: params.p,
            maxmem: 256 * params.N * params.r,
          },
          (err, key) => (err ? reject(err) : resolve(key)),
        );
        return;
    }
  });
}

// ---------------------------------------------------------------------------------------------
// Symmetric encryption (AES-256-GCM)

function aesGcmEncrypt(
  plaintext: Uint8Array,
  key: Uint8Array,
  aad?: Uint8Array,
): Buffer[] {
  if (key.length !== keyLength) throw new Error("Invalid key length");
  const nonce = randomBytes(nonceLength);
  const cipher = createCipheriv("aes-256-gcm", key, nonce);
  if (aad) cipher.setAAD(aad);
  const ciphertext = Buffer.concat([cipher.update(plaintext), cipher.final()]);
  return [nonce, ciphertext, cipher.getAuthTag()];
}

/** `body` is nonce ‖ ciphertext ‖ tag. */
function aesGcmDecrypt(
  body: Buffer,
  key: Uint8Array,
  aad?: Uint8Array,
): Buffer {
  if (key.length !== keyLength || body.length < nonceLength + tagLength) {
    throw new DecryptionError();
  }
  const nonce = body.subarray(0, nonceLength);
  const tag = body.subarray(body.length - tagLength);
  const ciphertext = body.subarray(nonceLength, body.length - tagLength);
  try {
    const decipher = createDecipheriv("aes-256-gcm", key, nonce);
    if (aad) decipher.setAAD(aad);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  } catch {
    throw new DecryptionError();
  }
}

/**
 * Wraps a key (or any short secret) under a symmetric key encryption key. `aad`, if given, must
 * be passed to `unwrap` again.
 */
export function wrap(key: Uint8Array, kek: Uint8Array, aad?: string): string {
  return encodeBlob(
    formatVersion,
    ...aesGcmEncrypt(key, kek, utf8OrUndefined(aad)),
  );
}

export function unwrap(
  wrapped: string,
  kek: Uint8Array,
  aad?: string,
): Uint8Array {
  return aesGcmDecrypt(
    decodeBlob(wrapped, nonceLength + tagLength, formatVersion),
    kek,
    utf8OrUndefined(aad),
  );
}

function utf8OrUndefined(text: string | undefined): Buffer | undefined {
  return text === undefined ? undefined : Buffer.from(text, "utf8");
}

/** A 32-byte key for one purpose, derived from `key` with HKDF-SHA256 and `info`. */
export function deriveSubkey(key: Uint8Array, info: string): Uint8Array {
  return Buffer.from(hkdfSync("sha256", key, Buffer.alloc(0), info, keyLength));
}

/** What an encrypted record's ciphertext is bound to. */
export interface RecordIdentity {
  id: string;
  kind: string;
  ownerId: string;
}

/** `RecordIdentity` as aad; uuids and enum names cannot contain the separator. */
function recordAad({ id, kind, ownerId }: RecordIdentity): string {
  return `${id}|${kind}|${ownerId}`;
}

/**
 * Plaintexts are padded to a multiple of this many bytes, so the ciphertext length does not
 * reveal how many flags someone set or which colours they chose.
 */
export const paddingBlockSize = 4096;

/** `JSON.parse` ignores trailing whitespace, so the padding needs no framing. */
function padWithSpaces(bytes: Buffer, blockSize: number): Buffer {
  const length = Math.ceil(bytes.length / blockSize) * blockSize;
  const padded = Buffer.alloc(length, 0x20);
  bytes.copy(padded);
  return padded;
}

/**
 * JSON → UTF-8 → padding → AES-256-GCM. `aad` binds the ciphertext to its row so ciphertexts cannot be
 * swapped between rows: a record's identity (format version 2), or the table key of the event
 * settings and survey schemas (version 1). Version 1 records, bound to their id alone, are read
 * by passing the id as a string.
 */
export function encryptJson(
  value: unknown,
  dataKey: Uint8Array,
  aad: string | RecordIdentity,
  padTo = paddingBlockSize,
): string {
  const plaintext = padWithSpaces(
    Buffer.from(JSON.stringify(value), "utf8"),
    padTo,
  );
  const [version, aadText] =
    typeof aad === "string"
      ? [formatVersion, aad]
      : [recordFormatVersion, recordAad(aad)];
  return encodeBlob(
    version,
    ...aesGcmEncrypt(plaintext, dataKey, Buffer.from(aadText, "utf8")),
  );
}

export function decryptJson<T = unknown>(
  blob: string,
  dataKey: Uint8Array,
  aad: string | RecordIdentity,
): T {
  const [version, aadText] =
    typeof aad === "string"
      ? [formatVersion, aad]
      : [recordFormatVersion, recordAad(aad)];
  const plaintext = aesGcmDecrypt(
    decodeBlob(blob, nonceLength + tagLength, version),
    dataKey,
    Buffer.from(aadText, "utf8"),
  );
  return JSON.parse(plaintext.toString("utf8")) as T;
}

/** HMAC-SHA256 of `message` under `key`, base64url. */
export function hmac(key: Uint8Array, message: string): string {
  return createHmac("sha256", key).update(message, "utf8").digest("base64url");
}

/** Constant-time comparison of two `hmac` results. */
export function hmacEquals(a: string, b: string): boolean {
  const x = fromBase64Url(a);
  const y = fromBase64Url(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

// ---------------------------------------------------------------------------------------------
// X25519 key pairs and sealing to a public key

// DER prefixes for raw 32-byte X25519 keys (RFC 8410).
const pkcs8Prefix = Buffer.from("302e020100300506032b656e04220420", "hex");
const spkiPrefix = Buffer.from("302a300506032b656e032100", "hex");

function privateKeyObject(raw: Uint8Array): KeyObject {
  if (raw.length !== keyLength) throw new DecryptionError();
  return createPrivateKey({
    key: Buffer.concat([pkcs8Prefix, raw]),
    format: "der",
    type: "pkcs8",
  });
}

function publicKeyObject(raw: Uint8Array): KeyObject {
  if (raw.length !== keyLength) throw new Error("Invalid public key");
  return createPublicKey({
    key: Buffer.concat([spkiPrefix, raw]),
    format: "der",
    type: "spki",
  });
}

function rawPublicKey(key: KeyObject): Uint8Array {
  const der = key.export({ format: "der", type: "spki" });
  return der.subarray(der.length - keyLength);
}

function rawPrivateKey(key: KeyObject): Uint8Array {
  const der = key.export({ format: "der", type: "pkcs8" });
  return der.subarray(der.length - keyLength);
}

export interface KeyPair {
  publicKey: Uint8Array;
  privateKey: Uint8Array;
}

/** X25519 key pair as raw 32-byte keys (base64url when stored). */
export function generateKeyPair(): KeyPair {
  const { publicKey, privateKey } = generateKeyPairSync("x25519");
  return {
    publicKey: rawPublicKey(publicKey),
    privateKey: rawPrivateKey(privateKey),
  };
}

export function publicKeyFromPrivate(privateKey: Uint8Array): Uint8Array {
  return rawPublicKey(createPublicKey(privateKeyObject(privateKey)));
}

function sealKey(
  shared: Uint8Array,
  ephemeral: Uint8Array,
  recipient: Uint8Array,
) {
  return Buffer.from(
    hkdfSync(
      "sha256",
      shared,
      Buffer.concat([ephemeral, recipient]),
      sealInfo,
      keyLength,
    ),
  );
}

/**
 * Ephemeral X25519 ECDH with the recipient's public key → HKDF-SHA256 → AES-256-GCM.
 * Output: version ‖ ephemeral public key ‖ nonce ‖ ciphertext ‖ tag.
 */
export function seal(
  plaintext: Uint8Array,
  recipientPublicKey: Uint8Array,
): string {
  const ephemeral = generateKeyPairSync("x25519");
  const ephemeralPublic = rawPublicKey(ephemeral.publicKey);
  const shared = diffieHellman({
    privateKey: ephemeral.privateKey,
    publicKey: publicKeyObject(recipientPublicKey),
  });
  const key = sealKey(shared, ephemeralPublic, recipientPublicKey);
  return encodeBlob(
    formatVersion,
    ephemeralPublic,
    ...aesGcmEncrypt(plaintext, key),
  );
}

export function open(
  sealed: string,
  recipientPrivateKey: Uint8Array,
): Uint8Array {
  const body = decodeBlob(
    sealed,
    keyLength + nonceLength + tagLength,
    formatVersion,
  );
  const ephemeralPublic = body.subarray(0, keyLength);
  let shared: Buffer;
  let recipientPublic: Uint8Array;
  try {
    const privateKey = privateKeyObject(recipientPrivateKey);
    recipientPublic = rawPublicKey(createPublicKey(privateKey));
    shared = diffieHellman({
      privateKey,
      publicKey: publicKeyObject(ephemeralPublic),
    });
  } catch {
    throw new DecryptionError();
  }
  const key = sealKey(shared, ephemeralPublic, recipientPublic);
  return aesGcmDecrypt(body.subarray(keyLength), key);
}

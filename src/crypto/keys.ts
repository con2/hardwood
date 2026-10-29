import { kdfPepper } from "@/config";
import type { User } from "@/prisma/models";

import {
  DecryptionError,
  deriveKek,
  deriveSubkey,
  fromBase64Url,
  isKdfParams,
  open,
  publicKeyFromPrivate,
  toBase64Url,
  unwrap,
  wrap,
} from "./primitives";

/**
 * The audience keys: enough to read and write INVITEE and GM records. This is what the command
 * line holds after unlocking with the recovery key.
 */
export interface AudienceKeys {
  inviteeKey: Uint8Array;
  /** The GM audience key doubles as the X25519 private key whose public half is `Event.gmPublicKey`. */
  gmKey: Uint8Array | null;
}

/** What a session holds: the user's identity, private key and the audience keys they can open. */
export interface Keys extends AudienceKeys {
  userId: string;
  privateKey: Uint8Array;
}

export function hasIdentity(keys: AudienceKeys | Keys): keys is Keys {
  return "userId" in keys && "privateKey" in keys;
}

type UserKeyMaterial = Pick<
  User,
  | "id"
  | "encryptedPrivateKey"
  | "kdfSalt"
  | "kdfParams"
  | "inviteeKeyWrap"
  | "gmKeyWrap"
>;

/**
 * Decrypts the user's private key with their password. The password is correct if and only if
 * the GCM tag verifies; there is no separate password hash. Returns null on a wrong password.
 */
export async function decryptPrivateKey(
  user: Pick<UserKeyMaterial, "encryptedPrivateKey" | "kdfSalt" | "kdfParams">,
  password: string,
): Promise<Uint8Array | null> {
  if (!isKdfParams(user.kdfParams)) {
    throw new Error("Unsupported KDF parameters");
  }
  const kek = await deriveKek(
    password,
    fromBase64Url(user.kdfSalt),
    user.kdfParams,
    kdfPepper,
  );
  try {
    return unwrap(user.encryptedPrivateKey, kek);
  } catch (error) {
    if (error instanceof DecryptionError) return null;
    throw error;
  }
}

/** Opens the audience keys sealed to the user's public key. */
export function unwrapAudienceKeys(
  user: Pick<UserKeyMaterial, "id" | "inviteeKeyWrap" | "gmKeyWrap">,
  privateKey: Uint8Array,
): Keys {
  return {
    userId: user.id,
    privateKey,
    inviteeKey: open(user.inviteeKeyWrap, privateKey),
    gmKey: user.gmKeyWrap ? open(user.gmKeyWrap, privateKey) : null,
  };
}

/** Password → Keys, or null when the password is wrong. */
export async function unlockKeys(
  user: UserKeyMaterial,
  password: string,
): Promise<Keys | null> {
  const privateKey = await decryptPrivateKey(user, password);
  return privateKey ? unwrapAudienceKeys(user, privateKey) : null;
}

/**
 * Whether a session's private key still belongs to the user row. False after a GM-led password
 * reset replaced the key pair: such a session can no longer open its SELF wraps and is useless.
 */
export function keysMatchUser(
  keys: Pick<Keys, "privateKey">,
  user: Pick<User, "publicKey">,
): boolean {
  return toBase64Url(publicKeyFromPrivate(keys.privateKey)) === user.publicKey;
}

const keyBindingInfo = "hardwood-key-binding-v1";

/** A user's public key binding does not verify under the INVITEE audience key. */
export class UnboundKey extends Error {
  constructor() {
    super("The public key binding does not verify");
    this.name = "UnboundKey";
  }
}

/**
 * `User.publicKeyBinding`: the public key wrapped under a key derived from the INVITEE audience
 * key, with the user id as aad. Only an invitee can produce it, so a database writer who replaces
 * `User.publicKey` cannot make others seal data keys to a key of their own.
 */
export function bindPublicKey(
  userId: string,
  publicKey: Uint8Array,
  inviteeKey: Uint8Array,
): string {
  return wrap(publicKey, deriveSubkey(inviteeKey, keyBindingInfo), userId);
}

/**
 * The user's public key, for sealing to, once its binding verifies. Throws `UnboundKey` if it
 * does not. Rows written before bindings existed have none and are let through with a warning
 * until `npm run upgrade` has bound every key.
 */
export function verifiedPublicKey(
  user: Pick<User, "id" | "publicKey" | "publicKeyBinding">,
  inviteeKey: Uint8Array,
): Uint8Array {
  const publicKey = fromBase64Url(user.publicKey);
  if (!user.publicKeyBinding) {
    console.warn(`User ${user.id} has no public key binding`);
    return publicKey;
  }
  let bound: Uint8Array;
  try {
    bound = unwrap(
      user.publicKeyBinding,
      deriveSubkey(inviteeKey, keyBindingInfo),
      user.id,
    );
  } catch (error) {
    if (error instanceof DecryptionError) throw new UnboundKey();
    throw error;
  }
  if (!publicKey.equals(bound)) throw new UnboundKey();
  return publicKey;
}

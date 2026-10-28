import type { User } from "@/prisma/models";

import {
  DecryptionError,
  deriveKek,
  fromBase64Url,
  isKdfParams,
  open,
  unwrap,
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

/**
 * Users, invitations and passwords. Functions that need audience keys take them explicitly so
 * they work from a GM session (`viewer.keys`) and from the command line (recovery key) alike.
 * Nothing here touches cookies: callers re-issue the session where needed.
 */
import { randomUUID } from "node:crypto";

import { kdfPepper, publicUrl } from "@/config";
import {
  bindPublicKey,
  hasIdentity,
  keysMatchUser,
  unlockKeys,
  decryptPrivateKey,
  verifiedPublicKey,
  type AudienceKeys,
  type Keys,
} from "@/crypto/keys";
import {
  defaultKdfParams,
  deriveKek,
  generateInitialPassword,
  generateKeyPair,
  generateSalt,
  hashToken,
  isKdfParams,
  open,
  publicKeyFromPrivate,
  randomToken,
  seal,
  toBase64Url,
  wrap,
  type KdfParams,
} from "@/crypto/primitives";
import { readRecord, rewrapSelfKeys, writeRecord } from "@/crypto/records";
import { parseDates } from "@/prisma/dates";
import { db, type Queryable, type Transaction } from "@/prisma/db";
import { RecordKind, UserStatus } from "@/prisma/enums";
import { toJson } from "@/prisma/json";
import type { User } from "@/prisma/models";
import { execute, query, sql } from "@/prisma/sql";
import { magicSlugs } from "@/components/forms/models";

import { lockoutMinutes } from "./lockout";
import type { VettingResponse } from "./types";

/** Runs `fn` in the caller's transaction if given one, else in a new transaction. */
async function inTransaction<T>(
  q: Queryable,
  fn: (tx: Queryable) => Promise<T>,
): Promise<T> {
  if (q === db) return db.transaction((tx: Transaction) => fn(tx));
  return fn(q);
}

function requireGmKey(keys: AudienceKeys): Uint8Array {
  if (!keys.gmKey) throw new Error("GM keys required");
  return keys.gmKey;
}

function isPeppered(params: KdfParams): boolean {
  return params.algorithm === "argon2id" && params.peppered === true;
}

/** The private key encrypted under a fresh salt and the default KDF parameters. */
async function encryptPrivateKey(privateKey: Uint8Array, password: string) {
  const salt = generateSalt();
  const kek = await deriveKek(password, salt, defaultKdfParams, kdfPepper);
  return {
    encryptedPrivateKey: wrap(privateKey, kek),
    kdfSalt: toBase64Url(salt),
    kdfParams: toJson(defaultKdfParams),
  };
}

export function invitationUrl(token: string): string {
  return `${publicUrl}/i/${token}`;
}

export async function getUser(
  userId: string,
  q: Queryable = db,
): Promise<User | null> {
  const row = await q.orm.public.User.first({ id: userId });
  return row ? parseDates(row) : null;
}

export async function findUserByToken(token: string): Promise<User | null> {
  const row = await db.orm.public.User.where({
    invitationTokenHash: hashToken(token),
  }).first();
  return row ? parseDates(row) : null;
}

export async function listUsers(): Promise<User[]> {
  const rows = await db.orm.public.User.orderBy((u) => u.createdAt.asc()).all();
  return rows.map((row) => parseDates(row));
}

/** The invitation token, which only GMs can recover (to copy the invitation link again). */
export function readInvitationToken(
  user: Pick<User, "invitationTokenWrap">,
  keys: AudienceKeys,
): string {
  return Buffer.from(
    open(user.invitationTokenWrap, requireGmKey(keys)),
  ).toString("utf8");
}

// ---------------------------------------------------------------------------------------------
// Invitations

export interface CreatedInvite {
  userId: string;
  token: string;
  initialPassword: string;
}

/**
 * Creates an invited user with a fresh key pair, its private key encrypted under a generated
 * initial password, and a vetting response pre-seeded with the Discord handle.
 */
export async function createInvite(
  {
    discordHandle,
    isGm,
    initialPassword = generateInitialPassword(),
  }: {
    discordHandle: string;
    isGm: boolean;
    /** Only the development seed (`src/bin/seed-dev.ts`) sets a known password. */
    initialPassword?: string;
  },
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<CreatedInvite> {
  const gmKey = requireGmKey(keys);
  const token = randomToken();
  const { publicKey, privateKey } = generateKeyPair();
  const encrypted = await encryptPrivateKey(privateKey, initialPassword);
  const userId = randomUUID();

  await inTransaction(q, async (tx) => {
    await tx.orm.public.User.create({
      id: userId,
      invitationTokenHash: hashToken(token),
      invitationTokenWrap: seal(
        Buffer.from(token, "utf8"),
        publicKeyFromPrivate(gmKey),
      ),
      status: UserStatus.INVITED,
      isGm,
      passwordPending: true,
      publicKey: toBase64Url(publicKey),
      publicKeyBinding: bindPublicKey(userId, publicKey, keys.inviteeKey),
      ...encrypted,
      inviteeKeyWrap: seal(keys.inviteeKey, publicKey),
      gmKeyWrap: isGm ? seal(gmKey, publicKey) : null,
    });
    const response: VettingResponse = {
      values: { [magicSlugs.discordHandle]: discordHandle },
      completed: false,
    };
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      userId,
      response,
      ["INVITEE"],
      keys,
      { tx },
    );
  });

  return { userId, token, initialPassword };
}

/** Gives an existing user the GM flag and the GM audience key. */
export async function promoteToGm(
  userId: string,
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<void> {
  const gmKey = requireGmKey(keys);
  const user = await getUser(userId, q);
  if (!user) throw new Error("User not found");
  await q.orm.public.User.where({ id: userId }).update({
    isGm: true,
    gmKeyWrap: seal(gmKey, verifiedPublicKey(user, keys.inviteeKey)),
  });
}

// ---------------------------------------------------------------------------------------------
// Sign in

export type SignInResult =
  | { ok: true; user: User; keys: Keys }
  | { ok: false; reason: "invalid" }
  | { ok: false; reason: "locked"; lockedUntil: Date }
  | { ok: false; reason: "revoked" };

/**
 * Checks the password of an invitation and returns the unlocked keys. Never throws for bad
 * credentials. An unknown token and a wrong password are indistinguishable to the caller.
 * REVOKED is only reported after a successful decrypt. The caller sets the session cookie.
 */
export async function signIn(
  token: string,
  password: string,
): Promise<SignInResult> {
  const user = await findUserByToken(token);
  if (!user) return { ok: false, reason: "invalid" };

  const now = new Date();
  if (user.lockedUntil && user.lockedUntil > now) {
    return { ok: false, reason: "locked", lockedUntil: user.lockedUntil };
  }

  const keys = await unlockKeys(user, password);
  if (!keys) {
    // Atomic increment, so parallel guesses cannot share one count.
    const [{ failed_sign_ins: failedSignIns }] = await query<{
      failed_sign_ins: number;
    }>(
      sql`update "user" set failed_sign_ins = failed_sign_ins + 1 where id = ${user.id} returning failed_sign_ins`,
    );
    const minutes = lockoutMinutes(failedSignIns);
    const lockedUntil =
      minutes > 0 ? new Date(now.getTime() + minutes * 60_000) : null;
    if (lockedUntil) {
      await db.orm.public.User.where({ id: user.id }).update({
        lockedUntil: lockedUntil.toISOString(),
      });
    }
    return lockedUntil
      ? { ok: false, reason: "locked", lockedUntil }
      : { ok: false, reason: "invalid" };
  }

  if (user.failedSignIns > 0 || user.lockedUntil) {
    await db.orm.public.User.where({ id: user.id }).update({
      failedSignIns: 0,
      lockedUntil: null,
    });
  }

  // The password is in hand only now: move keys from before the pepper to the default parameters.
  if (isKdfParams(user.kdfParams) && !isPeppered(user.kdfParams)) {
    await db.orm.public.User.where({ id: user.id }).update(
      await encryptPrivateKey(keys.privateKey, password),
    );
  }

  // The unlocked private key proves that `publicKey` is this user's, and the session holds the
  // INVITEE key the binding needs.
  if (!user.publicKeyBinding && keysMatchUser(keys, user)) {
    await db.orm.public.User.where({ id: user.id }).update({
      publicKeyBinding: bindPublicKey(
        user.id,
        publicKeyFromPrivate(keys.privateKey),
        keys.inviteeKey,
      ),
    });
  }

  if (user.status === UserStatus.REVOKED) {
    return { ok: false, reason: "revoked" };
  }

  return {
    ok: true,
    user: { ...user, failedSignIns: 0, lockedUntil: null },
    keys,
  };
}

// ---------------------------------------------------------------------------------------------
// Passwords

/** A signed-in user: a `Viewer` satisfies this. */
export interface Actor {
  keys: Keys;
}

/**
 * Sets the user's own password after an invitation or a GM-led reset, and their display name.
 * The private key is unchanged, only re-encrypted, so the session stays valid; the caller
 * re-issues it to refresh its expiry.
 */
export async function acceptInvitation(
  { keys }: Actor,
  { name, newPassword }: { name: string; newPassword: string },
): Promise<void> {
  const user = await getUser(keys.userId);
  if (!user) throw new Error("User not found");
  if (!user.passwordPending) throw new Error("Nothing to accept");

  const encrypted = await encryptPrivateKey(keys.privateKey, newPassword);
  const trimmedName = name.trim();

  await db.transaction(async (tx: Transaction) => {
    await tx.orm.public.User.where({ id: user.id }).update({
      ...encrypted,
      passwordPending: false,
      // A post-reset password set leaves the status alone.
      status:
        user.status === UserStatus.INVITED ? UserStatus.ENTERED : user.status,
    });
    if (trimmedName) {
      const response = (await readRecord(
        RecordKind.VETTING_RESPONSE,
        user.id,
        keys,
        tx,
      )) ?? { values: {}, completed: false };
      response.values[magicSlugs.name] = trimmedName;
      await writeRecord(
        RecordKind.VETTING_RESPONSE,
        user.id,
        response,
        ["INVITEE"],
        keys,
        { tx },
      );
    }
  });
}

export type ChangePasswordResult =
  { ok: true; sessionEpoch: number } | { ok: false; reason: "wrongPassword" };

/**
 * Re-encrypts the private key under a new password after checking the current one, and signs
 * the user out everywhere: the caller re-issues its own session with the returned epoch.
 */
export async function changePassword(
  { keys }: Actor,
  currentPassword: string,
  newPassword: string,
): Promise<ChangePasswordResult> {
  const user = await getUser(keys.userId);
  if (!user) throw new Error("User not found");
  const privateKey = await decryptPrivateKey(user, currentPassword);
  if (!privateKey) return { ok: false, reason: "wrongPassword" };

  const sessionEpoch = user.sessionEpoch + 1;
  await db.orm.public.User.where({ id: user.id }).update({
    ...(await encryptPrivateKey(privateKey, newPassword)),
    sessionEpoch,
  });
  return { ok: true, sessionEpoch };
}

/** Invalidates every session of the user, the caller's included. */
export async function signOutEverywhere(userId: string): Promise<void> {
  await execute(
    sql`update "user" set session_epoch = session_epoch + 1 where id = ${userId}`,
  );
}

/**
 * GM-led password reset: a new key pair and initial password. The audience keys and every
 * SELF-wrapped data key of the user are re-sealed to the new public key (the latter through
 * the GM wraps), so all their data survives. Returns the initial password for one-time display.
 */
export async function resetPassword(
  userId: string,
  keys: AudienceKeys | Keys,
): Promise<{ initialPassword: string }> {
  const gmKey = requireGmKey(keys);
  if (hasIdentity(keys) && keys.userId === userId) {
    throw new Error("Use Change Password for your own password");
  }
  const user = await getUser(userId);
  if (!user) throw new Error("User not found");

  const initialPassword = generateInitialPassword();
  const { publicKey, privateKey } = generateKeyPair();
  const encrypted = await encryptPrivateKey(privateKey, initialPassword);

  await db.transaction(async (tx: Transaction) => {
    await tx.orm.public.User.where({ id: userId }).update({
      publicKey: toBase64Url(publicKey),
      publicKeyBinding: bindPublicKey(userId, publicKey, keys.inviteeKey),
      ...encrypted,
      inviteeKeyWrap: seal(keys.inviteeKey, publicKey),
      gmKeyWrap: user.isGm ? seal(gmKey, publicKey) : null,
      passwordPending: true,
      sessionEpoch: user.sessionEpoch + 1,
      failedSignIns: 0,
      lockedUntil: null,
    });
    await rewrapSelfKeys(userId, gmKey, publicKey, tx);
  });

  return { initialPassword };
}

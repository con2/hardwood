/**
 * Audience key rotation, for when someone who held an audience key must lose it: a departed GM
 * (GM key) or a departed admin who could read the session secret (both keys). Run by
 * `npm run rotate-key` with the recovery key or a GM's credentials. Everyone affected signs in
 * again; their next sign-in opens the new key.
 */
import {
  bindPublicKey,
  verifiedPublicKey,
  type AudienceKeys,
} from "@/crypto/keys";
import {
  blobVersion,
  generateKeyPair,
  open,
  randomKey,
  recordFormatVersion,
  seal,
  toBase64Url,
  unwrap,
  wrap,
} from "@/crypto/primitives";
import {
  recordMac,
  rewriteEventSettingsAndSurveys,
  verifyGmKey,
} from "@/crypto/records";
import { db, type Queryable, type Transaction } from "@/prisma/db";

type RotationKeys = AudienceKeys & { gmKey: Uint8Array };

/** Data from before the cryptography review fixes is left: `npm run upgrade` first. */
export class NeedsUpgrade extends Error {
  constructor() {
    super("Run the upgrade before rotating keys");
    this.name = "NeedsUpgrade";
  }
}

async function requireUpgraded(tx: Queryable): Promise<void> {
  const users = await tx.orm.public.User.select("publicKeyBinding").all();
  const records =
    await tx.orm.public.EncryptedRecord.select("ciphertext").all();
  if (
    users.some((user) => !user.publicKeyBinding) ||
    records.some((row) => blobVersion(row.ciphertext) !== recordFormatVersion)
  ) {
    throw new NeedsUpgrade();
  }
}

/** Both audience keys wrapped under the recovery key, which may be a new one. */
function recoveryWraps(
  inviteeKey: Uint8Array,
  gmKey: Uint8Array,
  recoveryKey: Uint8Array,
) {
  return {
    inviteeKeyRecoveryWrap: wrap(inviteeKey, recoveryKey),
    gmKeyRecoveryWrap: wrap(gmKey, recoveryKey),
  };
}

/**
 * Replaces the GM audience key: re-seals every record's GM wrap and every invitation token to
 * the new public key, gives the new key to every GM, and signs the GMs out. `demote` first takes
 * the GM role from that user. Returns the new public key for the deployment's GM_PUBLIC_KEY:
 * until it is deployed, invitees seal to the old key, so keep the site down until then.
 */
export async function rotateGmKey(
  keys: RotationKeys,
  recoveryKey: Uint8Array,
  { demote }: { demote?: string } = {},
): Promise<{ gmPublicKey: string }> {
  await verifyGmKey(keys.gmKey);
  const next = generateKeyPair();

  await db.transaction(async (tx: Transaction) => {
    await requireUpgraded(tx);
    if (demote && !(await tx.orm.public.User.first({ id: demote }))) {
      throw new Error("User not found");
    }

    for (const row of await tx.orm.public.EncryptedRecord.where((r) =>
      r.gmKeyWrap.isNotNull(),
    ).all()) {
      await tx.orm.public.EncryptedRecord.where({ id: row.id }).update({
        gmKeyWrap: seal(open(row.gmKeyWrap!, keys.gmKey), next.publicKey),
      });
    }

    for (const user of await tx.orm.public.User.all()) {
      const isGm = user.isGm && user.id !== demote;
      await tx.orm.public.User.where({ id: user.id }).update({
        invitationTokenWrap: seal(
          open(user.invitationTokenWrap, keys.gmKey),
          next.publicKey,
        ),
        isGm,
        gmKeyWrap: isGm
          ? seal(next.privateKey, verifiedPublicKey(user, keys.inviteeKey))
          : null,
        sessionEpoch: user.sessionEpoch + (user.isGm ? 1 : 0),
      });
    }

    await tx.orm.public.Event.where({ id: 1 }).update({
      gmPublicKey: toBase64Url(next.publicKey),
      ...recoveryWraps(keys.inviteeKey, next.privateKey, recoveryKey),
    });
  });

  return { gmPublicKey: toBase64Url(next.publicKey) };
}

/**
 * Replaces the INVITEE audience key: re-wraps every record, event settings and survey data key
 * under the new key, recomputes record macs and key bindings (both derive from it), seals it to
 * every user and signs everyone out.
 */
export async function rotateInviteeKey(
  keys: RotationKeys,
  recoveryKey: Uint8Array,
): Promise<void> {
  await verifyGmKey(keys.gmKey);
  const nextKey = randomKey();

  await db.transaction(async (tx: Transaction) => {
    await requireUpgraded(tx);

    for (const row of await tx.orm.public.EncryptedRecord.all()) {
      await tx.orm.public.EncryptedRecord.where({ id: row.id }).update({
        inviteeKeyWrap: row.inviteeKeyWrap
          ? wrap(unwrap(row.inviteeKeyWrap, keys.inviteeKey), nextKey)
          : null,
        mac: recordMac(row, row.ciphertext, nextKey),
      });
    }

    await rewriteEventSettingsAndSurveys(keys, nextKey, tx);

    for (const user of await tx.orm.public.User.all()) {
      const publicKey = verifiedPublicKey(user, keys.inviteeKey);
      await tx.orm.public.User.where({ id: user.id }).update({
        inviteeKeyWrap: seal(nextKey, publicKey),
        publicKeyBinding: bindPublicKey(user.id, publicKey, nextKey),
        sessionEpoch: user.sessionEpoch + 1,
      });
    }

    await tx.orm.public.Event.where({ id: 1 }).update(
      recoveryWraps(nextKey, keys.gmKey, recoveryKey),
    );
  });
}

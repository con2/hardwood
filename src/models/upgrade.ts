/**
 * One-off conversion of data written before the 2026-10-29 cryptography review fixes, run by
 * `npm run upgrade` with the recovery key or a GM's credentials. Idempotent.
 */
import {
  bindPublicKey,
  UnboundKey,
  verifiedPublicKey,
  type AudienceKeys,
} from "@/crypto/keys";
import {
  blobVersion,
  fromBase64Url,
  recordFormatVersion,
} from "@/crypto/primitives";
import {
  readRecord,
  rewriteEventSettingsAndSurveys,
  verifyGmKey,
  writeRecord,
  type Audience,
} from "@/crypto/records";
import { db, type Queryable, type Transaction } from "@/prisma/db";

export interface UpgradeReport {
  /** Users whose public key had no binding and now has one. */
  boundKeys: number;
  /** Users whose existing binding does not verify: left alone, to be investigated. */
  badBindings: string[];
  /** Records rewritten from format version 1. */
  upgradedRecords: number;
  totalRecords: number;
}

/**
 * Checks that `Event.gmPublicKey` belongs to the GM key, binds every unbound user public key,
 * rewrites version 1 records in the current format (same data key and audiences) and re-encrypts
 * the event settings and survey schemas with padding.
 *
 * Binding trusts `User.publicKey` as it stands: run this before anyone could have tampered with
 * the database since the deployment that introduced bindings.
 */
export async function upgradeStoredData(
  keys: AudienceKeys & { gmKey: Uint8Array },
): Promise<UpgradeReport> {
  await verifyGmKey(keys.gmKey);
  return db.transaction(async (tx: Transaction) => {
    const report: UpgradeReport = {
      boundKeys: 0,
      badBindings: [],
      upgradedRecords: 0,
      totalRecords: 0,
    };
    await bindPublicKeys(keys, tx, report);
    await upgradeRecords(keys, tx, report);
    await rewriteEventSettingsAndSurveys(keys, keys.inviteeKey, tx);
    return report;
  });
}

async function bindPublicKeys(
  keys: AudienceKeys,
  tx: Queryable,
  report: UpgradeReport,
): Promise<void> {
  const users = await tx.orm.public.User.select(
    "id",
    "publicKey",
    "publicKeyBinding",
  ).all();
  for (const user of users) {
    if (user.publicKeyBinding) {
      try {
        verifiedPublicKey(user, keys.inviteeKey);
      } catch (error) {
        if (!(error instanceof UnboundKey)) throw error;
        report.badBindings.push(user.id);
      }
      continue;
    }
    await tx.orm.public.User.where({ id: user.id }).update({
      publicKeyBinding: bindPublicKey(
        user.id,
        fromBase64Url(user.publicKey),
        keys.inviteeKey,
      ),
    });
    report.boundKeys++;
  }
}

async function upgradeRecords(
  keys: AudienceKeys,
  tx: Queryable,
  report: UpgradeReport,
): Promise<void> {
  const rows = await tx.orm.public.EncryptedRecord.all();
  report.totalRecords = rows.length;
  for (const row of rows) {
    if (blobVersion(row.ciphertext) === recordFormatVersion) continue;
    const audiences: Audience[] = [];
    if (row.inviteeKeyWrap) audiences.push("INVITEE");
    if (row.gmKeyWrap) audiences.push("GM");
    if (row.selfKeyWrap) audiences.push("SELF");
    const content = await readRecord(row.kind, row.ownerId, keys, tx);
    await writeRecord(row.kind, row.ownerId, content!, audiences, keys, {
      tx,
    });
    report.upgradedRecords++;
  }
}

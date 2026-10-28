/**
 * Casting completion (docs/spec.md, "Casting completion and derived data"). The GMs' decisions
 * live in the GM-only `PLAYER_ATTRIBUTES`; completing the casting copies each ENTERED user's
 * decision into a `CASTING_RESULT` (SELF, GM) the user can read, with the mutual green flags
 * among SELECTED players, which no invitee could compute from others' encrypted flags.
 */
import type { AudienceKeys } from "@/crypto/keys";
import {
  readAllRecords,
  readEventSettings,
  writeEventSettings,
  writeRecord,
} from "@/crypto/records";
import { db, type Queryable, type Transaction } from "@/prisma/db";
import { RecordKind, UserStatus } from "@/prisma/enums";

import { readAllFlags } from "./flags";
import { computeMutualGreens } from "./mutualGreens";
import type { CastingDecision, Flag } from "./types";

/**
 * Writes `CASTING_RESULT` for every ENTERED user with a casting decision and deletes it from
 * everyone else. Leaves the completion timestamp alone.
 */
export async function recomputeCastingResults(
  keys: AudienceKeys,
  tx: Queryable,
): Promise<void> {
  const users = await tx.orm.public.User.where({
    status: UserStatus.ENTERED,
  })
    .select("id", "publicKey")
    .all();
  const attributes = await readAllRecords(
    RecordKind.PLAYER_ATTRIBUTES,
    keys,
    tx,
  );
  const decisions = new Map<string, CastingDecision>();
  for (const user of users) {
    const decision = attributes.get(user.id)?.castingDecision;
    if (decision) decisions.set(user.id, decision);
  }

  const flagsByUser = new Map<string, Record<string, Flag>>();
  for (const [ownerId, blob] of await readAllFlags(keys, tx)) {
    flagsByUser.set(ownerId, blob.flags);
  }
  const selectedIds = [...decisions]
    .filter(([, decision]) => decision === "SELECTED")
    .map(([id]) => id);
  const mutualGreens = computeMutualGreens(flagsByUser, selectedIds);

  for (const [userId, result] of decisions) {
    await writeRecord(
      RecordKind.CASTING_RESULT,
      userId,
      { result, mutualGreens: mutualGreens.get(userId) ?? [] },
      ["SELF", "GM"],
      keys,
      { tx },
    );
  }

  const stale = await tx.orm.public.EncryptedRecord.where({
    kind: RecordKind.CASTING_RESULT,
  })
    .select("id", "ownerId")
    .all();
  for (const row of stale) {
    if (!decisions.has(row.ownerId)) {
      await tx.orm.public.EncryptedRecord.where({ id: row.id }).delete();
    }
  }
}

/** Derives the casting results and marks the casting completed, in one transaction. */
export async function completeCasting(
  keys: AudienceKeys,
  now: Date,
): Promise<void> {
  await db.transaction(async (tx: Transaction) => {
    await recomputeCastingResults(keys, tx);
    const settings = await readEventSettings(keys, tx);
    await writeEventSettings(
      { ...settings, castingCompletedAt: now.toISOString() },
      keys,
      tx,
    );
  });
}

/** Deletes the derived casting results and marks the casting not completed. */
export async function revertCasting(keys: AudienceKeys): Promise<void> {
  await db.transaction(async (tx: Transaction) => {
    await tx.orm.public.EncryptedRecord.where({
      kind: RecordKind.CASTING_RESULT,
    }).deleteAndCount();
    const settings = await readEventSettings(keys, tx);
    await writeEventSettings(
      { ...settings, castingCompletedAt: null },
      keys,
      tx,
    );
  });
}

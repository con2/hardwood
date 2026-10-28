/**
 * Flags as the GMs see them. Each flagger's flags are one `FLAGS` blob (SELF, GM); reading them
 * all needs the GM audience key.
 */
import type { AudienceKeys } from "@/crypto/keys";
import { readAllRecords, writeRecord } from "@/crypto/records";
import { db, type Queryable } from "@/prisma/db";
import { RecordKind } from "@/prisma/enums";

import type { Flags } from "./types";

/** Every flagger's flags blob, by flagger id. GM keys required. */
export function readAllFlags(
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<Map<string, Flags>> {
  return readAllRecords(RecordKind.FLAGS, keys, q);
}

/**
 * Removes every flag on `targetId` from the other users' blobs, rewriting only the blobs that
 * had one. The data keys are opened through the GM wrap and kept, so the flaggers can still read
 * their blobs. Returns the number of blobs rewritten.
 */
export async function removeFlagsOn(
  targetId: string,
  keys: AudienceKeys,
  tx: Queryable,
): Promise<number> {
  let rewritten = 0;
  for (const [ownerId, blob] of await readAllFlags(keys, tx)) {
    if (ownerId === targetId || !(targetId in blob.flags)) continue;
    const flags = { ...blob.flags };
    delete flags[targetId];
    await writeRecord(
      RecordKind.FLAGS,
      ownerId,
      { ...blob, flags },
      ["SELF", "GM"],
      keys,
      { tx },
    );
    rewritten++;
  }
  return rewritten;
}

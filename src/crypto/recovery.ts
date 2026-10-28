/**
 * Unlocking the audience keys with the recovery key printed at initialisation. Command line only.
 */
import { db, type Queryable } from "@/prisma/db";

import type { AudienceKeys } from "./keys";
import { DecryptionError, fromBase64Url, unwrap } from "./primitives";

export class WrongRecoveryKey extends Error {
  constructor() {
    super("The recovery key does not open the audience keys");
    this.name = "WrongRecoveryKey";
  }
}

export async function unlockWithRecoveryKey(
  recoveryKey: string,
  q: Queryable = db,
): Promise<AudienceKeys> {
  const event = await q.orm.public.Event.first({ id: 1 });
  if (!event) throw new Error("The event has not been initialised");
  const key = fromBase64Url(recoveryKey.trim());
  try {
    return {
      inviteeKey: unwrap(event.inviteeKeyRecoveryWrap, key),
      gmKey: unwrap(event.gmKeyRecoveryWrap, key),
    };
  } catch (error) {
    if (error instanceof DecryptionError) throw new WrongRecoveryKey();
    throw error;
  }
}

/**
 * Self-withdrawal (docs/spec.md, process outline step 10; Privacy view). Sets the plaintext
 * status to WITHDRAWN and changes nothing else: the answers stay, locked by the permissions.
 *
 * Runs in the invitee's own session, which holds no GM key, so derived casting results of others
 * cannot be recomputed here; they catch up on the next GM status change or casting
 * revert/complete. Readers filter by status anyway.
 */
import { canWithdraw } from "@/auth/permissions";
import { db, type Transaction } from "@/prisma/db";
import { UserStatus } from "@/prisma/enums";

import { getUser } from "./user";
import { Forbidden } from "./vetting";

/** Withdraws the user; refused (`Forbidden`) unless they are ENTERED with no reset pending. */
export async function withdraw(userId: string): Promise<void> {
  await db.transaction(async (tx: Transaction) => {
    const user = await getUser(userId, tx);
    if (!user || !canWithdraw({ user })) throw new Forbidden();
    await tx.orm.public.User.where({ id: userId }).update({
      status: UserStatus.WITHDRAWN,
    });
  });
}

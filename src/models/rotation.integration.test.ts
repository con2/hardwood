import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Keys } from "@/crypto/keys";
import { fromBase64Url, randomKey, toBase64Url } from "@/crypto/primitives";
import {
  CannotDecrypt,
  readEventSettings,
  readRecord,
  writeRecord,
} from "@/crypto/records";
import { unlockWithRecoveryKey } from "@/crypto/recovery";
import { db } from "@/prisma/db";
import { RecordKind } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent, type Initialized } from "./bootstrap";
import { rotateGmKey, rotateInviteeKey } from "./rotation";
import {
  createInvite,
  getUser,
  readInvitationToken,
  signIn,
  type CreatedInvite,
} from "./user";

async function truncate() {
  await execute(
    sql`truncate table encrypted_record, "user", survey, event cascade`,
  );
}

async function signInOk(invite: CreatedInvite): Promise<Keys> {
  const result = await signIn(invite.token, invite.initialPassword);
  if (!result.ok) throw new Error(`sign-in failed: ${result.reason}`);
  return result.keys;
}

describe("audience key rotation", () => {
  let init: Initialized;
  let recoveryKey: Uint8Array;
  let alice: CreatedInvite;
  let otherGm: CreatedInvite;
  const flags = { flags: {}, completed: true };

  beforeAll(async () => {
    await truncate();
    init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord" },
      flags: testFlags,
    });
    recoveryKey = fromBase64Url(init.recoveryKey);
    alice = await createInvite(
      { discordHandle: "alice", isGm: false },
      init.keys,
    );
    otherGm = await createInvite(
      { discordHandle: "departing", isGm: true },
      init.keys,
    );
    const aliceKeys = await signInOk(alice);
    await writeRecord(
      RecordKind.FLAGS,
      alice.userId,
      flags,
      ["SELF", "GM"],
      aliceKeys,
    );
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("replaces the GM key and demotes a departing GM", async () => {
    const old = await unlockWithRecoveryKey(init.recoveryKey);
    const { gmPublicKey } = await rotateGmKey(old, recoveryKey, {
      demote: otherGm.userId,
    });

    const event = await db.orm.public.Event.first({ id: 1 });
    expect(event!.gmPublicKey).toBe(gmPublicKey);
    const gm = await signInOk(init);
    expect(Buffer.from(gm.gmKey!).equals(Buffer.from(old.gmKey))).toBe(false);
    expect(await readRecord(RecordKind.FLAGS, alice.userId, gm)).toEqual(flags);
    await expect(
      readRecord(RecordKind.FLAGS, alice.userId, old),
    ).rejects.toThrow(CannotDecrypt);
    expect(readInvitationToken((await getUser(alice.userId))!, gm)).toBe(
      alice.token,
    );

    const departed = await signInOk(otherGm);
    expect(departed.gmKey).toBeNull();
    expect((await getUser(otherGm.userId))!.isGm).toBe(false);
    // Sessions of every GM, including the departing one, are void.
    expect((await getUser(init.userId))!.sessionEpoch).toBe(1);
    expect((await getUser(otherGm.userId))!.sessionEpoch).toBe(1);
    expect((await getUser(alice.userId))!.sessionEpoch).toBe(0);

    const recovered = await unlockWithRecoveryKey(init.recoveryKey);
    expect(Buffer.from(recovered.gmKey).equals(Buffer.from(gm.gmKey!))).toBe(
      true,
    );
  });

  it("replaces the INVITEE key under a new recovery key", async () => {
    const old = await unlockWithRecoveryKey(init.recoveryKey);
    const newRecoveryKey = randomKey();
    await rotateInviteeKey(old, newRecoveryKey);

    const aliceKeys = await signInOk(alice);
    expect(
      Buffer.from(aliceKeys.inviteeKey).equals(Buffer.from(old.inviteeKey)),
    ).toBe(false);
    expect(await readRecord(RecordKind.FLAGS, alice.userId, aliceKeys)).toEqual(
      flags,
    );
    expect((await readEventSettings(aliceKeys)).flags).toEqual(testFlags);
    await expect(readEventSettings(old)).rejects.toThrow(CannotDecrypt);
    // Macs and bindings follow the new key: a GM session can still seal to Alice.
    const gm = await signInOk(init);
    await writeRecord(
      RecordKind.CASTING_RESULT,
      alice.userId,
      { result: "SELECTED", mutualGreens: [], selectedPeers: [] },
      ["SELF", "GM"],
      gm,
    );
    expect(
      await readRecord(RecordKind.CASTING_RESULT, alice.userId, aliceKeys),
    ).toMatchObject({ result: "SELECTED" });
    expect((await getUser(alice.userId))!.sessionEpoch).toBe(1);

    await expect(unlockWithRecoveryKey(init.recoveryKey)).rejects.toThrow();
    const recovered = await unlockWithRecoveryKey(toBase64Url(newRecoveryKey));
    expect(
      Buffer.from(recovered.inviteeKey).equals(
        Buffer.from(aliceKeys.inviteeKey),
      ),
    ).toBe(true);
  });
});

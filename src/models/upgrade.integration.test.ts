import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { AudienceKeys, Keys } from "@/crypto/keys";
import {
  blobVersion,
  encryptJson,
  generateKeyPair,
  open,
  recordFormatVersion,
  toBase64Url,
  unwrap,
} from "@/crypto/primitives";
import { GmKeyMismatch, readRecord, writeRecord } from "@/crypto/records";
import { db } from "@/prisma/db";
import { RecordKind } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent, type Initialized } from "./bootstrap";
import { createInvite, signIn } from "./user";
import { upgradeStoredData } from "./upgrade";

async function truncate() {
  await execute(
    sql`truncate table encrypted_record, "user", survey, event cascade`,
  );
}

async function signInOk(token: string, password: string): Promise<Keys> {
  const result = await signIn(token, password);
  if (!result.ok) throw new Error(`sign-in failed: ${result.reason}`);
  return result.keys;
}

/** Rewrites every record as the code before record macs wrote it: aad = id, no mac. */
async function downgradeRecords(keys: AudienceKeys) {
  for (const row of await db.orm.public.EncryptedRecord.all()) {
    const content = await readRecord(row.kind, row.ownerId, keys);
    const dataKey = row.inviteeKeyWrap
      ? unwrap(row.inviteeKeyWrap, keys.inviteeKey)
      : open(row.gmKeyWrap!, keys.gmKey!);
    await db.orm.public.EncryptedRecord.where({ id: row.id }).update({
      ciphertext: encryptJson(content, dataKey, row.id),
      mac: null,
    });
  }
}

async function recordVersions() {
  const rows = await db.orm.public.EncryptedRecord.all();
  return rows.map((row) => [blobVersion(row.ciphertext), row.mac !== null]);
}

describe("upgrade", () => {
  let init: Initialized;
  let alice: Keys;
  let aliceId: string;
  const flags = { flags: {}, completed: true };
  const vetting = { values: { name: "Alice" }, completed: true };

  beforeAll(async () => {
    await truncate();
    init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord" },
      flags: testFlags,
    });
    const invite = await createInvite(
      { discordHandle: "alice", isGm: false },
      init.keys,
    );
    aliceId = invite.userId;
    alice = await signInOk(invite.token, invite.initialPassword);
    await writeRecord(RecordKind.FLAGS, aliceId, flags, ["SELF", "GM"], alice);
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      aliceId,
      vetting,
      ["INVITEE", "GM"],
      alice,
    );
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("binds keys and rewrites version 1 records, once", async () => {
    await execute(sql`update "user" set public_key_binding = null`);
    await downgradeRecords(init.keys);
    // Alice's flags and vetting response, and the GM's vetting response from the invitation.
    expect(await recordVersions()).toEqual([
      [1, false],
      [1, false],
      [1, false],
    ]);

    const report = await upgradeStoredData({
      ...init.keys,
      gmKey: init.keys.gmKey!,
    });
    expect(report).toEqual({
      boundKeys: 2,
      badBindings: [],
      upgradedRecords: 3,
      totalRecords: 3,
    });
    expect(await recordVersions()).toEqual([
      [recordFormatVersion, true],
      [recordFormatVersion, true],
      [recordFormatVersion, true],
    ]);
    const users = await db.orm.public.User.all();
    expect(users.every((user) => user.publicKeyBinding)).toBe(true);

    // The owner still opens the SELF wrap; the GMs the GM wrap.
    expect(
      await readRecord(RecordKind.FLAGS, aliceId, { ...alice, gmKey: null }),
    ).toEqual(flags);
    expect(
      await readRecord(RecordKind.VETTING_RESPONSE, aliceId, init.keys),
    ).toEqual(vetting);

    expect(
      await upgradeStoredData({ ...init.keys, gmKey: init.keys.gmKey! }),
    ).toMatchObject({ boundKeys: 0, upgradedRecords: 0 });
  });

  it("refuses to run when the Event row holds another GM public key", async () => {
    const event = await db.orm.public.Event.first({ id: 1 });
    await db.orm.public.Event.where({ id: 1 }).update({
      gmPublicKey: toBase64Url(generateKeyPair().publicKey),
    });
    try {
      await expect(
        upgradeStoredData({ ...init.keys, gmKey: init.keys.gmKey! }),
      ).rejects.toThrow(GmKeyMismatch);
    } finally {
      await db.orm.public.Event.where({ id: 1 }).update({
        gmPublicKey: event!.gmPublicKey,
      });
    }
  });
});

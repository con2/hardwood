import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { initializeEvent } from "@/models/bootstrap";
import { createInvite, signIn } from "@/models/user";
import { db } from "@/prisma/db";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";

import type { AudienceKeys, Keys } from "./keys";
import { generateKeyPair } from "./primitives";
import {
  CannotDecrypt,
  readRecord,
  readSurvey,
  rewrapSelfKeys,
  writeRecord,
  writeSurvey,
} from "./records";

async function truncate() {
  await execute(
    sql`truncate table encrypted_record, "user", survey, event cascade`,
  );
}

async function keysOf(token: string, password: string): Promise<Keys> {
  const result = await signIn(token, password);
  if (!result.ok) throw new Error(result.reason);
  return result.keys;
}

describe("encrypted records", () => {
  let gm: Keys;
  let alice: Keys;
  let bob: Keys;
  let cli: AudienceKeys;

  beforeAll(async () => {
    await truncate();
    const init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord" },
    });
    cli = init.keys;
    gm = await keysOf(init.token, init.initialPassword);
    const a = await createInvite({ discordHandle: "alice", isGm: false }, cli);
    const b = await createInvite({ discordHandle: "bob", isGm: false }, cli);
    alice = await keysOf(a.token, a.initialPassword);
    bob = await keysOf(b.token, b.initialPassword);
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("produces exactly the requested wraps and reuses the data key", async () => {
    await writeRecord(
      RecordKind.FLAGS,
      alice.userId,
      { flags: {}, completed: false },
      ["SELF", "GM"],
      alice,
    );
    const first = await db.orm.public.EncryptedRecord.where({
      kind: RecordKind.FLAGS,
      ownerId: alice.userId,
    }).first();
    expect(first!.selfKeyWrap).not.toBeNull();
    expect(first!.gmKeyWrap).not.toBeNull();
    expect(first!.inviteeKeyWrap).toBeNull();

    await writeRecord(
      RecordKind.FLAGS,
      alice.userId,
      { flags: { [bob.userId]: "GREEN" }, completed: true },
      ["SELF", "GM"],
      alice,
    );
    const second = await db.orm.public.EncryptedRecord.where({
      kind: RecordKind.FLAGS,
      ownerId: alice.userId,
    }).first();
    expect(second!.id).toBe(first!.id);
    expect(await readRecord(RecordKind.FLAGS, alice.userId, gm)).toEqual({
      flags: { [bob.userId]: "GREEN" },
      completed: true,
    });

    // A GM-only record is invisible to the owner.
    await writeRecord(
      RecordKind.PLAYER_ATTRIBUTES,
      alice.userId,
      {
        castingDecision: "SELECTED",
        characterName: "",
        characterGroup: null,
        feeCategory: null,
        feePaid: false,
      },
      ["GM"],
      gm,
    );
    await expect(
      readRecord(RecordKind.PLAYER_ATTRIBUTES, alice.userId, alice),
    ).rejects.toThrow(CannotDecrypt);
    await expect(
      readRecord(RecordKind.FLAGS, alice.userId, bob),
    ).rejects.toThrow(CannotDecrypt);
    expect(
      await readRecord(RecordKind.CASTING_RESULT, alice.userId, alice),
    ).toBeNull();
  });

  it("refuses to swap ciphertexts between rows", async () => {
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      alice.userId,
      { values: { name: "A" }, completed: false },
      ["INVITEE"],
      alice,
    );
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      bob.userId,
      { values: { name: "B" }, completed: false },
      ["INVITEE"],
      bob,
    );
    const rowA = await db.orm.public.EncryptedRecord.where({
      kind: RecordKind.VETTING_RESPONSE,
      ownerId: alice.userId,
    }).first();
    await db.orm.public.EncryptedRecord.where({
      kind: RecordKind.VETTING_RESPONSE,
      ownerId: bob.userId,
    }).update({
      ciphertext: rowA!.ciphertext,
      inviteeKeyWrap: rowA!.inviteeKeyWrap,
    });
    await expect(
      readRecord(RecordKind.VETTING_RESPONSE, bob.userId, gm),
    ).rejects.toThrow(CannotDecrypt);
  });

  it("re-seals SELF wraps to a new public key", async () => {
    const next = generateKeyPair();
    await rewrapSelfKeys(alice.userId, gm.gmKey!, next.publicKey);
    expect(
      await readRecord(RecordKind.FLAGS, alice.userId, {
        ...alice,
        privateKey: next.privateKey,
        gmKey: null,
      }),
    ).toMatchObject({ completed: true });
    await expect(
      readRecord(RecordKind.FLAGS, alice.userId, { ...alice, gmKey: null }),
    ).rejects.toThrow(CannotDecrypt);
  });

  it("lets a GM write a SELF record for its owner", async () => {
    await expect(
      writeRecord(
        RecordKind.CASTING_RESULT,
        bob.userId,
        { result: "SELECTED", mutualGreens: [], selectedPeers: [] },
        ["SELF", "GM"],
        gm,
      ),
    ).resolves.toBeUndefined();
    expect(
      await readRecord(RecordKind.CASTING_RESULT, bob.userId, bob),
    ).toEqual({ result: "SELECTED", mutualGreens: [], selectedPeers: [] });
  });

  it("round-trips survey schemas", async () => {
    await writeSurvey(
      SurveySlug.practical,
      [{ type: "StaticText", slug: "intro", title: "Hi" }],
      gm,
    );
    expect(await readSurvey(SurveySlug.practical, bob)).toEqual([
      { type: "StaticText", slug: "intro", title: "Hi" },
    ]);
  });
});

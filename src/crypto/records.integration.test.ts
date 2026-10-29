import { randomUUID } from "node:crypto";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { initializeEvent } from "@/models/bootstrap";
import { createInvite, signIn } from "@/models/user";
import { db } from "@/prisma/db";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { UnboundKey, type AudienceKeys, type Keys } from "./keys";
import {
  encryptJson,
  generateKeyPair,
  publicKeyFromPrivate,
  randomKey,
  seal,
  toBase64Url,
} from "./primitives";
import {
  CannotDecrypt,
  readAllRecords,
  readRecord,
  recordMac,
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

async function moveRecord(kind: RecordKind, from: string, to: string) {
  const count = await execute(
    sql`update encrypted_record set owner_id = ${to} where kind = ${kind} and owner_id = ${from}`,
  );
  return { count };
}

async function deleteRecords(kind: RecordKind) {
  await execute(sql`delete from encrypted_record where kind = ${kind}`);
}

const forgedAttributes = {
  castingDecision: "SELECTED" as const,
  characterName: "",
  characterGroup: null,
  feeCategory: null,
  feePaid: true,
};

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
      flags: testFlags,
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
      { flags: { [bob.userId]: "green" }, completed: true },
      ["SELF", "GM"],
      alice,
    );
    const second = await db.orm.public.EncryptedRecord.where({
      kind: RecordKind.FLAGS,
      ownerId: alice.userId,
    }).first();
    expect(second!.id).toBe(first!.id);
    expect(await readRecord(RecordKind.FLAGS, alice.userId, gm)).toEqual({
      flags: { [bob.userId]: "green" },
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

  it("refuses a record whose owner was changed", async () => {
    await writeRecord(
      RecordKind.PRACTICAL_RESPONSE,
      alice.userId,
      { values: { diet: "vegan" }, completed: true },
      ["SELF", "GM"],
      alice,
    );
    const { count } = await moveRecord(
      RecordKind.PRACTICAL_RESPONSE,
      alice.userId,
      bob.userId,
    );
    expect(count).toBe(1);
    try {
      await expect(
        readRecord(RecordKind.PRACTICAL_RESPONSE, bob.userId, gm),
      ).rejects.toThrow(CannotDecrypt);
    } finally {
      await deleteRecords(RecordKind.PRACTICAL_RESPONSE);
    }
  });

  it("refuses a forged record sealed to the GM key without a valid mac", async () => {
    // Anyone with database write access can seal a data key to the GM public key.
    const gmPublicKey = publicKeyFromPrivate(gm.gmKey!);
    const identity = {
      id: randomUUID(),
      kind: RecordKind.PLAYER_ATTRIBUTES,
      ownerId: gm.userId,
    };
    const dataKey = randomKey();
    const ciphertext = encryptJson(forgedAttributes, dataKey, identity);
    await db.orm.public.EncryptedRecord.create({
      ...identity,
      ciphertext,
      gmKeyWrap: seal(dataKey, gmPublicKey),
    });
    try {
      await expect(
        readRecord(RecordKind.PLAYER_ATTRIBUTES, gm.userId, gm),
      ).rejects.toThrow(CannotDecrypt);
      await db.orm.public.EncryptedRecord.where({ id: identity.id }).update({
        mac: recordMac(identity, ciphertext, randomKey()),
      });
      await expect(
        readAllRecords(RecordKind.PLAYER_ATTRIBUTES, gm),
      ).rejects.toThrow(CannotDecrypt);
    } finally {
      await deleteRecords(RecordKind.PLAYER_ATTRIBUTES);
    }
  });

  it("refuses a version 1 record", async () => {
    // The format from before record macs (aad = id, no mac), which anyone could forge.
    const id = randomUUID();
    const dataKey = randomKey();
    await db.orm.public.EncryptedRecord.create({
      id,
      kind: RecordKind.PLAYER_ATTRIBUTES,
      ownerId: gm.userId,
      ciphertext: encryptJson(forgedAttributes, dataKey, id),
      gmKeyWrap: seal(dataKey, publicKeyFromPrivate(gm.gmKey!)),
    });
    try {
      await expect(
        readRecord(RecordKind.PLAYER_ATTRIBUTES, gm.userId, gm),
      ).rejects.toThrow(CannotDecrypt);
    } finally {
      await deleteRecords(RecordKind.PLAYER_ATTRIBUTES);
    }
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

  it("refuses to seal to a user whose key binding does not match", async () => {
    // A database writer replaces Bob's public key with one of their own.
    const original = await db.orm.public.User.first({ id: bob.userId });
    const attacker = generateKeyPair();
    await db.orm.public.User.where({ id: bob.userId }).update({
      publicKey: toBase64Url(attacker.publicKey),
    });
    try {
      await expect(
        writeRecord(
          RecordKind.CASTING_RESULT,
          bob.userId,
          { result: "SELECTED", mutualGreens: [], selectedPeers: [] },
          ["SELF", "GM"],
          gm,
        ),
      ).rejects.toThrow(UnboundKey);
    } finally {
      await db.orm.public.User.where({ id: bob.userId }).update({
        publicKey: original!.publicKey,
      });
    }
  });

  it("refuses to seal to a user without a key binding", async () => {
    const original = await db.orm.public.User.first({ id: bob.userId });
    await db.orm.public.User.where({ id: bob.userId }).update({
      publicKeyBinding: null,
    });
    try {
      await expect(
        writeRecord(
          RecordKind.CASTING_RESULT,
          bob.userId,
          { result: "SELECTED", mutualGreens: [], selectedPeers: [] },
          ["SELF", "GM"],
          gm,
        ),
      ).rejects.toThrow(UnboundKey);
    } finally {
      await db.orm.public.User.where({ id: bob.userId }).update({
        publicKeyBinding: original!.publicKeyBinding,
      });
    }
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

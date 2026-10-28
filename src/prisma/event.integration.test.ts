import { afterAll, describe, expect, it } from "vitest";

import { db } from "./db";
import { parseDates } from "./dates";
import { pool } from "./pool";

describe("Event", () => {
  afterAll(async () => {
    await db.orm.public.Event.where({ id: 1 }).delete();
    await pool.end();
  });

  it("inserts and reads back the singleton row", async () => {
    await db.orm.public.Event.where({ id: 1 }).delete();
    await db.orm.public.Event.create({
      id: 1,
      ciphertext: "ciphertext",
      inviteeKeyWrap: "invitee-key-wrap",
      inviteeKeyRecoveryWrap: "invitee-key-recovery-wrap",
      gmKeyRecoveryWrap: "gm-key-recovery-wrap",
    });

    const row = await db.orm.public.Event.first({ id: 1 });
    expect(row).not.toBeNull();
    const event = parseDates(row!);
    expect(event.ciphertext).toBe("ciphertext");
    expect(event.privacyPolicy).toBe("");
    expect(event.createdAt).toBeInstanceOf(Date);
    expect(Number.isNaN(event.createdAt.getTime())).toBe(false);
    expect(event.updatedAt).toBeInstanceOf(Date);

    await db.orm.public.Event.where({ id: 1 }).delete();
    expect(await db.orm.public.Event.first({ id: 1 })).toBeNull();
  });
});

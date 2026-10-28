import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Keys } from "@/crypto/keys";
import { readRecord, writeRecord } from "@/crypto/records";
import { RecordKind, UserStatus } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";

import { initializeEvent } from "./bootstrap";
import { createInvites } from "./players";
import { acceptInvitation, getUser, signIn } from "./user";
import { Forbidden } from "./vetting";
import { withdraw } from "./withdraw";

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

describe("withdraw", () => {
  const ids = new Map<string, string>();
  let enteredKeys: Keys;

  beforeAll(async () => {
    await truncate();
    const init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord handle" },
    });
    const gmKeys = await signInOk(init.token, init.initialPassword);
    await acceptInvitation(
      { keys: gmKeys },
      { name: "Gm", newPassword: "gm-password" },
    );
    const invites = await createInvites(["entered", "invited"], gmKeys);
    for (const invite of invites) ids.set(invite.discordHandle, invite.userId);
    const entered = invites.find((i) => i.discordHandle === "entered")!;
    enteredKeys = await signInOk(
      entered.url.split("/i/")[1],
      entered.initialPassword,
    );
    await acceptInvitation(
      { keys: enteredKeys },
      { name: "Eero", newPassword: "pw" },
    );
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      entered.userId,
      { values: { name: "Eero", about: "Hello" }, completed: true },
      ["INVITEE"],
      enteredKeys,
    );
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("refuses an invitee who has not accepted", async () => {
    await expect(withdraw(ids.get("invited")!)).rejects.toThrow(Forbidden);
    expect((await getUser(ids.get("invited")!))!.status).toBe(
      UserStatus.INVITED,
    );
  });

  it("withdraws an ENTERED invitee and keeps their answers", async () => {
    const id = ids.get("entered")!;
    await withdraw(id);
    expect((await getUser(id))!.status).toBe(UserStatus.WITHDRAWN);
    expect(
      await readRecord(RecordKind.VETTING_RESPONSE, id, enteredKeys),
    ).toEqual({ values: { name: "Eero", about: "Hello" }, completed: true });
  });

  it("refuses to withdraw twice", async () => {
    await expect(withdraw(ids.get("entered")!)).rejects.toThrow(Forbidden);
  });

  it("refuses an unknown user", async () => {
    await expect(
      withdraw("00000000-0000-4000-8000-000000000000"),
    ).rejects.toThrow(Forbidden);
  });
});

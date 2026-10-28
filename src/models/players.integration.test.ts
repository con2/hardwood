import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Keys } from "@/crypto/keys";
import {
  readEventSettings,
  readRecord,
  writeEventSettings,
  writeRecord,
} from "@/crypto/records";
import { RecordKind, UserStatus } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, query, sql } from "@/prisma/sql";

import { initializeEvent } from "./bootstrap";
import { completeCasting, revertCasting } from "./casting";
import { readAllFlags } from "./flags";
import {
  createInvites,
  deletePlayer,
  listPlayers,
  PlayerError,
  resetPlayerPassword,
  setUiStatus,
  updatePlayerAttributes,
  type CreatedInviteRow,
} from "./players";
import type { Flags } from "./types";
import { acceptInvitation, getUser, signIn } from "./user";

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

function tokenOf(url: string): string {
  return url.split("/i/")[1];
}

describe("players", () => {
  let gmKeys: Keys;
  let invites: CreatedInviteRow[];
  /** handle → keys after accepting. */
  const keysOf = new Map<string, Keys>();
  const idOf = (handle: string) =>
    invites.find((i) => i.discordHandle === handle)!.userId;

  beforeAll(async () => {
    await truncate();
    const init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord handle" },
    });
    gmKeys = await signInOk(init.token, init.initialPassword);
    await acceptInvitation(
      { keys: gmKeys },
      { name: "Gm", newPassword: "gm-password" },
    );
    const settings = await readEventSettings(gmKeys);
    await writeEventSettings(
      {
        ...settings,
        characterGroups: [{ slug: "staff", title: "Staff" }],
        feeCategories: [{ slug: "normal", title: "Normal" }],
      },
      gmKeys,
    );
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("creates invites and lists them by handle", async () => {
    invites = await createInvites(
      ["alpha", "bravo", "charlie", "delta", "echo", "alpha", " "],
      gmKeys,
    );
    expect(invites.map((i) => i.discordHandle)).toEqual([
      "alpha",
      "bravo",
      "charlie",
      "delta",
      "echo",
    ]);
    for (const invite of invites) {
      expect(invite.url).toMatch(/\/i\/[^/]+$/);
      expect(invite.initialPassword).toBeTruthy();
    }

    const rows = await listPlayers(gmKeys);
    expect(rows).toHaveLength(6);
    // The accepted GM first, invited ones last.
    expect(rows[0].name).toBe("Gm");
    const alpha = rows.find((r) => r.discordHandle === "alpha")!;
    expect(alpha.uiStatus).toBe("INVITED");
    expect(alpha.vetting).toBe("inProgress");
    expect(alpha.flagging).toBe("none");
    expect(alpha.invitationUrl).toBe(invites[0].url);

    for (const handle of ["alpha", "bravo", "charlie", "delta"]) {
      const invite = invites.find((i) => i.discordHandle === handle)!;
      const keys = await signInOk(tokenOf(invite.url), invite.initialPassword);
      await acceptInvitation(
        { keys },
        { name: handle.toUpperCase(), newPassword: `${handle}-pw` },
      );
      keysOf.set(handle, keys);
    }
  });

  it("changes statuses within the transition rules", async () => {
    const echo = idOf("echo");
    await setUiStatus(echo, "REVOKED", gmKeys);
    expect((await getUser(echo))!.status).toBe(UserStatus.REVOKED);
    await expect(setUiStatus(echo, "SELECTED", gmKeys)).rejects.toThrow(
      PlayerError,
    );
    await setUiStatus(echo, "INVITED", gmKeys);

    await expect(setUiStatus(idOf("alpha"), "INVITED", gmKeys)).rejects.toThrow(
      PlayerError,
    );
    await setUiStatus(idOf("alpha"), "SELECTED", gmKeys);
    await setUiStatus(idOf("bravo"), "SELECTED", gmKeys);
    await setUiStatus(idOf("charlie"), "SELECTED", gmKeys);
    await setUiStatus(idOf("delta"), "NOT_SELECTED", gmKeys);
    await setUiStatus(idOf("delta"), "ENTERED", gmKeys);
    await setUiStatus(idOf("delta"), "NOT_SELECTED", gmKeys);

    const rows = await listPlayers(gmKeys);
    const status = (handle: string) =>
      rows.find((r) => r.discordHandle === handle)!.uiStatus;
    expect(status("alpha")).toBe("SELECTED");
    expect(status("delta")).toBe("NOT_SELECTED");
    expect(status("echo")).toBe("INVITED");
    expect((await getUser(idOf("alpha")))!.status).toBe(UserStatus.ENTERED);
  });

  it("updates player attributes", async () => {
    await updatePlayerAttributes(
      idOf("alpha"),
      { characterName: "  Aatu  ", characterGroup: "staff", feePaid: true },
      gmKeys,
    );
    await expect(
      updatePlayerAttributes(idOf("alpha"), { feeCategory: "nope" }, gmKeys),
    ).rejects.toThrow(PlayerError);
    const alpha = (await listPlayers(gmKeys)).find(
      (r) => r.discordHandle === "alpha",
    )!;
    expect(alpha.attributes).toEqual({
      castingDecision: "SELECTED",
      characterName: "Aatu",
      characterGroup: "staff",
      feeCategory: null,
      feePaid: true,
    });
  });

  it("derives casting results with mutual greens and reverts them", async () => {
    const [a, b, c, d] = ["alpha", "bravo", "charlie", "delta"].map(idOf);
    const writeFlags = (owner: string, flags: Flags["flags"]) =>
      writeRecord(
        RecordKind.FLAGS,
        owner,
        { flags, completed: true },
        ["SELF", "GM"],
        keysOf.get(invites.find((i) => i.userId === owner)!.discordHandle)!,
      );
    await writeFlags(a, { [b]: "GREEN", [c]: "GREEN", [d]: "GREEN" });
    await writeFlags(b, { [a]: "GREEN", [c]: "RED" });
    await writeFlags(c, { [a]: "YELLOW" });
    await writeFlags(d, { [a]: "GREEN" });

    await completeCasting(gmKeys, new Date("2027-02-01T12:00:00Z"));
    expect((await readEventSettings(gmKeys)).castingCompletedAt).toBe(
      "2027-02-01T12:00:00.000Z",
    );

    // Readable by the owner (SELF) as well as the GMs.
    expect(
      await readRecord(RecordKind.CASTING_RESULT, a, keysOf.get("alpha")!),
    ).toEqual({
      result: "SELECTED",
      mutualGreens: [b],
      selectedPeers: expect.arrayContaining([b, c]),
    });
    expect(await readRecord(RecordKind.CASTING_RESULT, b, gmKeys)).toEqual({
      result: "SELECTED",
      mutualGreens: [a],
      selectedPeers: expect.arrayContaining([a, c]),
    });
    expect(await readRecord(RecordKind.CASTING_RESULT, c, gmKeys)).toEqual({
      result: "SELECTED",
      mutualGreens: [],
      selectedPeers: expect.arrayContaining([a, b]),
    });
    // Not selected: no mutual greens even though a and d green each other, and no peers.
    expect(await readRecord(RecordKind.CASTING_RESULT, d, gmKeys)).toEqual({
      result: "NOT_SELECTED",
      mutualGreens: [],
      selectedPeers: [],
    });
    // No decision, no record.
    expect(
      await readRecord(RecordKind.CASTING_RESULT, idOf("echo"), gmKeys),
    ).toBeNull();

    // A status change while completed updates the derived records.
    await setUiStatus(c, "ENTERED", gmKeys);
    expect(await readRecord(RecordKind.CASTING_RESULT, c, gmKeys)).toBeNull();
    await setUiStatus(c, "SELECTED", gmKeys);

    await revertCasting(gmKeys);
    expect((await readEventSettings(gmKeys)).castingCompletedAt).toBeNull();
    const [{ count }] = await query<{ count: string }>(
      sql`select count(*) from encrypted_record where kind = 'CASTING_RESULT'`,
    );
    expect(Number(count)).toBe(0);
  });

  it("refuses to delete a user who has not withdrawn", async () => {
    await expect(deletePlayer(idOf("bravo"), gmKeys)).rejects.toThrow(
      PlayerError,
    );
  });

  it("deletes a withdrawn user and scrubs the flags of others", async () => {
    const [a, b] = ["alpha", "bravo"].map(idOf);
    await completeCasting(gmKeys, new Date());
    await setUiStatus(b, "WITHDRAWN", gmKeys);
    // Withdrawal while completed drops b from a's mutual greens and peers already.
    const before = await readRecord(RecordKind.CASTING_RESULT, a, gmKeys);
    expect(before).toMatchObject({ result: "SELECTED", mutualGreens: [] });
    expect(before!.selectedPeers).not.toContain(b);

    await deletePlayer(b, gmKeys);
    expect(await getUser(b)).toBeNull();
    const flags = await readAllFlags(gmKeys);
    expect(flags.has(b)).toBe(false);
    for (const blob of flags.values()) {
      expect(Object.keys(blob.flags)).not.toContain(b);
    }
    // The flagger can still read their rewritten blob.
    expect(await readRecord(RecordKind.FLAGS, a, keysOf.get("alpha")!)).toEqual(
      {
        flags: { [idOf("charlie")]: "GREEN", [idOf("delta")]: "GREEN" },
        completed: true,
      },
    );
    const [{ count }] = await query<{ count: string }>(
      sql`select count(*) from encrypted_record where owner_id = ${b}`,
    );
    expect(Number(count)).toBe(0);
    await revertCasting(gmKeys);
  });

  it("resets a password: the new initial password works and data survives", async () => {
    const a = idOf("alpha");
    const { url, initialPassword } = await resetPlayerPassword(a, gmKeys);
    expect(url).toBe(invites[0].url);
    expect((await signIn(tokenOf(url), "alpha-pw")).ok).toBe(false);
    const keys = await signInOk(tokenOf(url), initialPassword);
    expect((await getUser(a))!.passwordPending).toBe(true);
    expect((await readRecord(RecordKind.FLAGS, a, keys))!.completed).toBe(true);
    expect(
      (await readRecord(RecordKind.VETTING_RESPONSE, a, keys))!.values.name,
    ).toBe("ALPHA");
    await expect(resetPlayerPassword(gmKeys.userId, gmKeys)).rejects.toThrow(
      PlayerError,
    );
  });
});

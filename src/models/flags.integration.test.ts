import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { flaggingMode } from "@/auth/permissions";
import type { Keys } from "@/crypto/keys";
import {
  readEventSettings,
  readRecord,
  writeEventSettings,
  writeRecord,
} from "@/crypto/records";
import { RecordKind } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";
import { getTranslations } from "@/translations";

import { initializeEvent } from "./bootstrap";
import { completeCasting } from "./casting";
import { defaultFlagDefinitions } from "./flagDefinitions";
import {
  flagMatrix,
  flagsForPerson,
  listFlaggable,
  mutualGreensFor,
  readAllFlags,
  readOwnFlags,
  setFlag,
  setFlagsCompleted,
  type FlaggingActor,
} from "./flags";
import { createInvites, setUiStatus } from "./players";
import { defaultEventSettings, type EventSettings } from "./types";
import { acceptInvitation, getUser, signIn } from "./user";
import { Forbidden } from "./vetting";

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

const now = new Date("2027-01-15T12:00:00Z");
const flaggingOpen: EventSettings = {
  ...defaultEventSettings,
  flags: testFlags,
  signupStartsAt: "2027-01-01T00:00:00Z",
  previewStartsAt: "2027-01-05T00:00:00Z",
  signupEndsAt: "2027-01-10T00:00:00Z",
  flaggingEndsAt: "2027-01-20T00:00:00Z",
};
const flaggingClosed: EventSettings = {
  ...flaggingOpen,
  flaggingEndsAt: "2027-01-14T00:00:00Z",
};

describe("flags", () => {
  let gmKeys: Keys;
  /** handle → user id */
  const ids = new Map<string, string>();
  const keysOf = new Map<string, Keys>();
  const id = (handle: string) => ids.get(handle)!;

  async function actor(
    handle: string,
    settings: EventSettings = flaggingOpen,
  ): Promise<FlaggingActor> {
    const keys = keysOf.get(handle)!;
    const user = (await getUser(id(handle)))!;
    const vetting = await readRecord(
      RecordKind.VETTING_RESPONSE,
      user.id,
      keys,
    );
    const castingResult = settings.castingCompletedAt
      ? await readRecord(RecordKind.CASTING_RESULT, user.id, keys)
      : null;
    return {
      user,
      keys,
      settings,
      vettingCompleted: vetting?.completed ?? false,
      castingResult,
      hasPracticalResponse: false,
    };
  }

  beforeAll(async () => {
    await truncate();
    const init = await initializeEvent({
      discordHandle: "gm",
      titles: { name: "Name", discordHandle: "Discord handle" },
      flags: testFlags,
    });
    gmKeys = await signInOk(init.token, init.initialPassword);
    await acceptInvitation(
      { keys: gmKeys },
      { name: "Gm", newPassword: "gm-password" },
    );
    await writeEventSettings(flaggingOpen, gmKeys);

    const handles = ["alpha", "bravo", "charlie", "delta", "echo"];
    const invites = await createInvites(handles, gmKeys);
    for (const invite of invites) {
      const keys = await signInOk(
        invite.url.split("/i/")[1],
        invite.initialPassword,
      );
      const name = invite.discordHandle.toUpperCase();
      await acceptInvitation(
        { keys },
        { name, newPassword: `${invite.discordHandle}-pw` },
      );
      ids.set(invite.discordHandle, invite.userId);
      keysOf.set(invite.discordHandle, keys);
      // delta never completes their response.
      await writeRecord(
        RecordKind.VETTING_RESPONSE,
        invite.userId,
        {
          values: {
            name,
            discord_handle: invite.discordHandle,
            about: `I am ${name}`,
          },
          completed: invite.discordHandle !== "delta",
        },
        ["INVITEE"],
        keys,
      );
    }
    await setUiStatus(id("echo"), "WITHDRAWN", gmKeys);
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("lists the completed, non-withdrawn others", async () => {
    const alpha = await actor("alpha");
    expect(flaggingMode(alpha, now)).toBe("flagging");
    const people = await listFlaggable(alpha, now);
    expect(people.map((p) => p.name)).toEqual(["BRAVO", "CHARLIE"]);
    expect(people[0]).toEqual({
      userId: id("bravo"),
      name: "BRAVO",
      discordHandle: "bravo",
      values: { name: "BRAVO", discord_handle: "bravo", about: "I am BRAVO" },
    });
  });

  it("writes flags readable by the flagger and the GMs; neutral removes", async () => {
    const alpha = await actor("alpha");
    expect(await readOwnFlags(alpha)).toEqual({ flags: {}, completed: false });

    await setFlag(alpha, id("bravo"), "green", now);
    await setFlag(alpha, id("charlie"), "red", now);
    expect((await readOwnFlags(alpha)).flags).toEqual({
      [id("bravo")]: "green",
      [id("charlie")]: "red",
    });
    expect((await readAllFlags(gmKeys)).get(id("alpha"))!.flags).toEqual({
      [id("bravo")]: "green",
      [id("charlie")]: "red",
    });

    await setFlag(alpha, id("charlie"), "neutral", now);
    expect((await readOwnFlags(alpha)).flags).toEqual({
      [id("bravo")]: "green",
    });

    await setFlagsCompleted(alpha, true, now);
    expect(await readOwnFlags(alpha)).toEqual({
      flags: { [id("bravo")]: "green" },
      completed: true,
    });
  });

  it("refuses flags the event does not define; custom ones count under their slug", async () => {
    const alpha = await actor("alpha");
    await expect(setFlag(alpha, id("bravo"), "purple", now)).rejects.toThrow(
      Forbidden,
    );

    const purple = { slug: "purple", title: "Purple", definition: "" };
    const withPurple = { ...flaggingOpen, flags: [...testFlags, purple] };
    const alphaWithPurple = await actor("alpha", withPurple);
    await setFlag(alphaWithPurple, id("bravo"), "purple", now);
    expect((await readOwnFlags(alpha)).flags[id("bravo")]).toBe("purple");
    const matrix = await flagMatrix(gmKeys, withPurple.flags);
    expect(matrix.flags.map((flag) => flag.slug)).toEqual([
      "red",
      "yellow",
      "green",
      "purple",
    ]);
    expect(matrix.totals[id("bravo")].received).toEqual({
      red: 0,
      yellow: 0,
      green: 0,
      purple: 1,
    });

    // Without purple among the event's flags the stored slug counts as neutral.
    const without = await flagMatrix(gmKeys, testFlags);
    expect(without.rows[id("alpha")]).toEqual({});
    expect(without.totals[id("bravo")].received.green).toBe(0);
    await setFlag(alpha, id("bravo"), "green", now);
  });

  it("falls back to the default flags when none are stored", async () => {
    await writeEventSettings({ ...flaggingOpen, flags: [] }, gmKeys);
    // In the event's language, which need not be the English of the fixtures.
    expect((await readEventSettings(gmKeys)).flags).toEqual(
      defaultFlagDefinitions(getTranslations().Flagging.defaultFlags),
    );
    await writeEventSettings(flaggingOpen, gmKeys);
  });

  it("refuses flags outside the period and on non-flaggable targets", async () => {
    const alpha = await actor("alpha");
    for (const target of ["alpha", "delta", "echo"]) {
      await expect(setFlag(alpha, id(target), "red", now)).rejects.toThrow(
        Forbidden,
      );
    }
    await expect(
      setFlag(alpha, "00000000-0000-4000-8000-000000000000", "red", now),
    ).rejects.toThrow(Forbidden);

    const closed = await actor("alpha", flaggingClosed);
    expect(flaggingMode(closed, now)).toBe("readonly");
    await expect(setFlag(closed, id("bravo"), "red", now)).rejects.toThrow(
      Forbidden,
    );
    await expect(setFlagsCompleted(closed, false, now)).rejects.toThrow(
      Forbidden,
    );

    // delta has not completed their response: no Flagging view at all.
    const delta = await actor("delta");
    expect(flaggingMode(delta, now)).toBe("none");
    await expect(setFlag(delta, id("bravo"), "red", now)).rejects.toThrow(
      Forbidden,
    );
  });

  it("builds the GM matrix with totals", async () => {
    await setFlag(await actor("bravo"), id("alpha"), "green", now);
    await setFlag(await actor("bravo"), id("charlie"), "yellow", now);
    await setFlag(await actor("charlie"), id("alpha"), "red", now);
    // A flag on echo made before they withdrew is kept for the GMs.
    await writeRecord(
      RecordKind.FLAGS,
      id("charlie"),
      {
        flags: { [id("alpha")]: "red", [id("echo")]: "yellow" },
        completed: false,
      },
      ["SELF", "GM"],
      keysOf.get("charlie")!,
    );

    const matrix = await flagMatrix(gmKeys, testFlags);
    expect(matrix.users.map((u) => u.name)).toEqual([
      "ALPHA",
      "BRAVO",
      "CHARLIE",
      "DELTA",
      "ECHO",
      "Gm",
    ]);
    expect(matrix.users.find((u) => u.name === "ECHO")!.withdrawn).toBe(true);
    expect(matrix.rows[id("bravo")]).toEqual({
      [id("alpha")]: "green",
      [id("charlie")]: "yellow",
    });
    expect(matrix.totals[id("alpha")]).toEqual({
      received: { red: 1, yellow: 0, green: 1 },
      given: { red: 0, yellow: 0, green: 1 },
    });
    expect(matrix.totals[id("echo")].received).toEqual({
      red: 0,
      yellow: 1,
      green: 0,
    });
    expect(matrix.totals[id("delta")]).toEqual({
      received: { red: 0, yellow: 0, green: 0 },
      given: { red: 0, yellow: 0, green: 0 },
    });

    const alpha = (await flagsForPerson(gmKeys, id("alpha"), testFlags))!;
    expect(alpha.inbound.map((f) => [f.from.name, f.slug])).toEqual([
      ["BRAVO", "green"],
      ["CHARLIE", "red"],
    ]);
    expect(alpha.outbound.map((f) => [f.to.name, f.slug])).toEqual([
      ["BRAVO", "green"],
    ]);
    expect(
      await flagsForPerson(
        gmKeys,
        "00000000-0000-4000-8000-000000000000",
        testFlags,
      ),
    ).toBeNull();
  });

  it("shows mutual greens after casting and names only to the non-selected", async () => {
    await setUiStatus(id("alpha"), "SELECTED", gmKeys);
    await setUiStatus(id("bravo"), "SELECTED", gmKeys);
    await setUiStatus(id("charlie"), "NOT_SELECTED", gmKeys);
    await writeEventSettings(flaggingClosed, gmKeys);
    await completeCasting(gmKeys, now);
    const settings = await readEventSettings(gmKeys);

    const alpha = await actor("alpha", settings);
    const bravo = await actor("bravo", settings);
    const charlie = await actor("charlie", settings);
    expect(mutualGreensFor(alpha)).toEqual(new Set([id("bravo")]));
    expect(mutualGreensFor(bravo)).toEqual(new Set([id("alpha")]));
    expect(mutualGreensFor(charlie)).toEqual(new Set());

    expect(flaggingMode(alpha, now)).toBe("readonly");
    expect(flaggingMode(charlie, now)).toBe("names-only");
    // Names of those charlie flagged, the withdrawn echo included; no answers.
    expect(await listFlaggable(charlie, now)).toEqual([
      { userId: id("alpha"), name: "ALPHA", discordHandle: "alpha" },
      { userId: id("echo"), name: "ECHO", discordHandle: "echo" },
    ]);
  });

  it("lists only the other selected players to a selected viewer after casting", async () => {
    // delta completes their response but has no decision: undecided.
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      id("delta"),
      { values: { name: "DELTA", discord_handle: "delta" }, completed: true },
      ["INVITEE"],
      keysOf.get("delta")!,
    );
    const settings = await readEventSettings(gmKeys);
    const alpha = await actor("alpha", settings);
    expect(alpha.castingResult!.selectedPeers).toEqual([id("bravo")]);
    const listed = (await listFlaggable(alpha, now)).map((p) => p.userId);
    // Neither the NOT_SELECTED charlie nor the undecided delta.
    expect(listed).toEqual([id("bravo")]);
  });
});

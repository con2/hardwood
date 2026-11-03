import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Field } from "@/components/forms/models";
import type { Keys } from "@/crypto/keys";
import { readSurvey, writeRecord, writeSurvey } from "@/crypto/records";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent } from "./bootstrap";
import { createInvites, setUiStatus } from "./players";
import { readPlayerDetail, surveySummary } from "./responses";
import { acceptInvitation, signIn } from "./user";

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

const colour: Field = {
  type: "SingleSelect",
  slug: "colour",
  title: "Colour",
  choices: [
    { slug: "red", title: "Red" },
    { slug: "blue", title: "Blue" },
  ],
};

describe("GM response reads", () => {
  let gmKeys: Keys;
  const ids = new Map<string, string>();
  const keysOf = new Map<string, Keys>();

  const writeVetting = (
    handle: string,
    colourSlug: string,
    completed: boolean,
  ) =>
    writeRecord(
      RecordKind.VETTING_RESPONSE,
      ids.get(handle)!,
      { values: { name: handle, colour: colourSlug }, completed },
      ["INVITEE"],
      keysOf.get(handle)!,
    );

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
    await writeSurvey(
      SurveySlug.vetting,
      [...(await readSurvey(SurveySlug.vetting, gmKeys)), colour],
      gmKeys,
    );
    await writeSurvey(SurveySlug.practical, [colour], gmKeys);

    const invites = await createInvites(
      ["done", "draft", "rejected", "pending"],
      gmKeys,
    );
    for (const invite of invites) {
      ids.set(invite.discordHandle, invite.userId);
      if (invite.discordHandle === "pending") continue;
      const keys = await signInOk(
        invite.url.split("/i/")[1],
        invite.initialPassword,
      );
      await acceptInvitation(
        { keys },
        { name: invite.discordHandle, newPassword: "password-123" },
      );
      keysOf.set(invite.discordHandle, keys);
    }

    await writeVetting("done", "red", true);
    await writeVetting("draft", "blue", false);
    await writeVetting("rejected", "blue", true);
    await setUiStatus(ids.get("rejected")!, "NOT_SELECTED", gmKeys);

    await writeRecord(
      RecordKind.PRACTICAL_RESPONSE,
      ids.get("draft")!,
      { values: { colour: "red" }, completed: false },
      ["SELF", "GM"],
      keysOf.get("draft")!,
    );
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("counts only completed vetting responses of accepted players", async () => {
    const summary = await surveySummary(gmKeys, SurveySlug.vetting, "all");
    // gm, done, draft, rejected; the invited one is not counted.
    expect(summary.countPeople).toBe(4);
    expect(summary.countResponses).toBe(2);
    expect(summary.summaries).toEqual([
      expect.objectContaining({
        counts: { red: 1, blue: 1 },
        countMissing: 0,
      }),
    ]);
  });

  it("narrows the vetting summary by the filter", async () => {
    const summary = await surveySummary(
      gmKeys,
      SurveySlug.vetting,
      "hide-not-selected",
    );
    expect(summary.countPeople).toBe(3);
    expect(summary.countResponses).toBe(1);
    expect(summary.summaries[0]).toMatchObject({ counts: { red: 1, blue: 0 } });
  });

  it("counts practical responses whether completed or not", async () => {
    const summary = await surveySummary(gmKeys, SurveySlug.practical, "all");
    expect(summary.countResponses).toBe(1);
    expect(summary.summaries[0]).toMatchObject({ counts: { red: 1, blue: 0 } });
  });

  it("returns a vetting response only once completed", async () => {
    const done = await readPlayerDetail(gmKeys, ids.get("done")!);
    expect(done?.vetting).toEqual({
      state: "completed",
      response: {
        values: { name: "done", colour: "red" },
        completed: true,
      },
    });
    expect(done?.practical).toEqual({ state: "none", response: null });

    const draft = await readPlayerDetail(gmKeys, ids.get("draft")!);
    expect(draft?.person).toMatchObject({
      name: "draft",
      uiStatus: "ENTERED",
      withdrawn: false,
    });
    expect(draft?.vetting).toEqual({ state: "inProgress", response: null });
    expect(draft?.practical).toEqual({
      state: "inProgress",
      response: { values: { colour: "red" }, completed: false },
    });
  });

  it("returns null for someone not accepted or unknown", async () => {
    expect(await readPlayerDetail(gmKeys, ids.get("pending")!)).toBeNull();
    expect(
      await readPlayerDetail(gmKeys, "00000000-0000-4000-8000-000000000000"),
    ).toBeNull();
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { canEditPractical, canSeePractical } from "@/auth/permissions";
import processFormData from "@/components/forms/processFormData";
import type { Keys } from "@/crypto/keys";
import {
  readEventSettings,
  readRecord,
  writeEventSettings,
  writeSurvey,
} from "@/crypto/records";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent } from "./bootstrap";
import { completeCasting, revertCasting } from "./casting";
import { createInvites, setUiStatus } from "./players";
import {
  savePracticalAnswers,
  setPracticalCompleted,
  type PracticalActor,
} from "./practical";
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

function form(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

const now = new Date("2027-03-15T12:00:00Z");
const practicalOpen: EventSettings = {
  ...defaultEventSettings,
  signupStartsAt: "2027-01-01T00:00:00Z",
  signupEndsAt: "2027-01-10T00:00:00Z",
  practicalStartsAt: "2027-03-01T00:00:00Z",
  practicalEndsAt: "2027-04-01T00:00:00Z",
};

describe("practical response", () => {
  let gmKeys: Keys;
  const ids = new Map<string, string>();
  const keysOf = new Map<string, Keys>();

  async function actor(handle: string): Promise<PracticalActor> {
    const keys = keysOf.get(handle)!;
    const user = (await getUser(ids.get(handle)!))!;
    const settings = await readEventSettings(keys);
    const castingResult = settings.castingCompletedAt
      ? await readRecord(RecordKind.CASTING_RESULT, user.id, keys)
      : null;
    const practical = await readRecord(
      RecordKind.PRACTICAL_RESPONSE,
      user.id,
      keys,
    );
    return {
      user,
      keys,
      settings,
      vettingCompleted: true,
      castingResult,
      hasPracticalResponse: practical !== null,
    };
  }

  const save = (a: PracticalActor, entries: Record<string, string>) =>
    savePracticalAnswers(
      a,
      (fields) => processFormData(fields, form(entries)),
      now,
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
    await writeEventSettings(practicalOpen, gmKeys);
    await writeSurvey(
      SurveySlug.practical,
      [
        {
          type: "SingleLineText",
          slug: "diet",
          title: "Dietary restrictions",
          required: true,
        },
      ],
      gmKeys,
    );

    const invites = await createInvites(["sel", "notsel", "wd"], gmKeys);
    for (const invite of invites) {
      const keys = await signInOk(
        invite.url.split("/i/")[1],
        invite.initialPassword,
      );
      await acceptInvitation(
        { keys },
        { name: invite.discordHandle, newPassword: "pw" },
      );
      ids.set(invite.discordHandle, invite.userId);
      keysOf.set(invite.discordHandle, keys);
    }
    await setUiStatus(ids.get("sel")!, "SELECTED", gmKeys);
    await setUiStatus(ids.get("wd")!, "SELECTED", gmKeys);
    await setUiStatus(ids.get("notsel")!, "NOT_SELECTED", gmKeys);
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("is closed to everyone until the casting is completed", async () => {
    const sel = await actor("sel");
    expect(canSeePractical(sel, now)).toBe(false);
    await expect(save(sel, { diet: "none" })).rejects.toThrow(Forbidden);
  });

  it("lets a selected player save and complete after casting", async () => {
    await completeCasting(gmKeys, now);
    const sel = await actor("sel");
    expect(canEditPractical(sel, now)).toBe(true);

    const empty = await save(sel, {});
    expect(empty.missing).toEqual(["diet"]);
    const saved = await save(sel, { diet: "vegan" });
    expect(saved).toEqual({
      response: { values: { diet: "vegan" }, completed: false },
      missing: [],
    });
    const completed = await setPracticalCompleted(sel, true, now);
    expect(completed.response).toEqual({
      values: { diet: "vegan" },
      completed: true,
    });

    // SELF and GM can read it.
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, sel.user.id, sel.keys),
    ).toEqual({ values: { diet: "vegan" }, completed: true });
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, sel.user.id, gmKeys),
    ).toEqual({ values: { diet: "vegan" }, completed: true });
    // Another invitee cannot.
    await expect(
      readRecord(
        RecordKind.PRACTICAL_RESPONSE,
        sel.user.id,
        keysOf.get("notsel")!,
      ),
    ).rejects.toThrow("Cannot decrypt");
  });

  it("refuses a non-selected invitee", async () => {
    const notsel = await actor("notsel");
    expect(canSeePractical(notsel, now)).toBe(false);
    await expect(save(notsel, { diet: "none" })).rejects.toThrow(Forbidden);
    await expect(setPracticalCompleted(notsel, true, now)).rejects.toThrow(
      Forbidden,
    );
  });

  it("shows a withdrawn player their response read-only", async () => {
    await save(await actor("wd"), { diet: "gluten-free" });
    await setUiStatus(ids.get("wd")!, "WITHDRAWN", gmKeys);
    const wd = await actor("wd");
    expect(wd.hasPracticalResponse).toBe(true);
    expect(canSeePractical(wd, now)).toBe(true);
    expect(canEditPractical(wd, now)).toBe(false);
    await expect(save(wd, { diet: "none" })).rejects.toThrow(Forbidden);
    expect(
      await readRecord(RecordKind.PRACTICAL_RESPONSE, wd.user.id, gmKeys),
    ).toEqual({ values: { diet: "gluten-free" }, completed: false });
  });

  it("refuses after the practical survey closes", async () => {
    const settings = await readEventSettings(gmKeys);
    await writeEventSettings(
      { ...settings, practicalEndsAt: "2027-03-10T00:00:00Z" },
      gmKeys,
    );
    const sel = await actor("sel");
    expect(canSeePractical(sel, now)).toBe(true);
    await expect(save(sel, { diet: "none" })).rejects.toThrow(Forbidden);
    await revertCasting(gmKeys);
  });
});

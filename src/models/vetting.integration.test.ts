import { afterAll, beforeAll, describe, expect, it } from "vitest";

import processFormData from "@/components/forms/processFormData";
import type { Keys } from "@/crypto/keys";
import { readRecord, readSurvey, writeSurvey } from "@/crypto/records";
import { RecordKind, SurveySlug, UserStatus } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent } from "./bootstrap";
import { defaultEventSettings, type EventSettings } from "./types";
import { acceptInvitation, createInvite, getUser, signIn } from "./user";
import {
  Forbidden,
  saveVettingAnswers,
  setVettingCompleted,
  type SignupActor,
} from "./vetting";

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

const now = new Date("2027-01-05T12:00:00Z");
const open: EventSettings = {
  ...defaultEventSettings,
  signupStartsAt: "2027-01-01T00:00:00Z",
  signupEndsAt: "2027-01-10T00:00:00Z",
};
const closed: EventSettings = {
  ...open,
  signupEndsAt: "2027-01-04T00:00:00Z",
};

function form(entries: Record<string, string>): FormData {
  const formData = new FormData();
  for (const [key, value] of Object.entries(entries)) formData.set(key, value);
  return formData;
}

describe("vetting response", () => {
  let gmKeys: Keys;
  let actor: SignupActor;

  beforeAll(async () => {
    await truncate();
    const init = await initializeEvent({
      discordHandle: "gm#1",
      titles: { name: "Name", discordHandle: "Discord handle" },
      flags: testFlags,
    });
    gmKeys = await signInOk(init.token, init.initialPassword);
    await writeSurvey(
      SurveySlug.vetting,
      [
        ...(await readSurvey(SurveySlug.vetting, gmKeys)),
        {
          type: "MultiLineText",
          slug: "about",
          title: "About you",
          required: true,
        },
      ],
      gmKeys,
    );

    const invite = await createInvite(
      { discordHandle: "invitee#2", isGm: false },
      gmKeys,
    );
    const keys = await signInOk(invite.token, invite.initialPassword);
    await acceptInvitation({ keys }, { name: "Iida", newPassword: "pw" });
    const user = (await getUser(invite.userId))!;
    expect(user.status).toBe(UserStatus.ENTERED);
    actor = {
      user,
      keys,
      settings: open,
      vettingCompleted: false,
      castingResult: null,
      hasPracticalResponse: false,
    };
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  const read = () =>
    readRecord(RecordKind.VETTING_RESPONSE, actor.user.id, actor.keys);

  it("saves answers over the pre-filled ones", async () => {
    const saved = await saveVettingAnswers(
      actor,
      (fields) =>
        processFormData(
          fields,
          form({ name: "Iida I.", discord_handle: "iida", about: "" }),
        ),
      now,
    );
    expect(saved.missing).toEqual(["about"]);
    expect(await read()).toEqual({
      values: { name: "Iida I.", discord_handle: "iida", about: "" },
      completed: false,
    });
  });

  it("marks the response completed and keeps the answers", async () => {
    const saved = await setVettingCompleted(actor, true, now);
    expect(saved.missing).toEqual(["about"]);
    expect(await read()).toEqual({
      values: { name: "Iida I.", discord_handle: "iida", about: "" },
      completed: true,
    });
  });

  it("keeps the completion and orphaned answers when saving answers", async () => {
    // The GMs remove the `about` field.
    const fields = await readSurvey(SurveySlug.vetting, gmKeys);
    await writeSurvey(
      SurveySlug.vetting,
      fields.filter((field) => field.slug !== "about"),
      gmKeys,
    );
    // A stale form still posts it.
    const saved = await saveVettingAnswers(
      actor,
      (fields) =>
        processFormData(
          fields,
          form({ name: "Iida", discord_handle: "iida", about: "changed" }),
        ),
      now,
    );
    expect(saved.missing).toEqual([]);
    expect(await read()).toEqual({
      values: { name: "Iida", discord_handle: "iida", about: "" },
      completed: true,
    });
  });

  it("refuses to save outside the sign-up period", async () => {
    const closedActor = { ...actor, settings: closed };
    await expect(
      saveVettingAnswers(
        closedActor,
        (fields) => processFormData(fields, form({ name: "Late" })),
        now,
      ),
    ).rejects.toThrow(Forbidden);
    await expect(setVettingCompleted(closedActor, false, now)).rejects.toThrow(
      Forbidden,
    );
    expect((await read())?.values.name).toBe("Iida");
  });

  it("refuses to save for a withdrawn invitee", async () => {
    const withdrawn = {
      ...actor,
      user: { ...actor.user, status: UserStatus.WITHDRAWN },
    };
    await expect(setVettingCompleted(withdrawn, false, now)).rejects.toThrow(
      Forbidden,
    );
    expect((await read())?.completed).toBe(true);
  });
});

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import type { Keys } from "@/crypto/keys";
import {
  CannotDecrypt,
  readAllFeedback,
  readEventSettings,
  writeEventSettings,
} from "@/crypto/records";
import { db } from "@/prisma/db";
import { pool } from "@/prisma/pool";
import { execute, sql } from "@/prisma/sql";
import { testFlags } from "@/test/flags";

import { initializeEvent } from "./bootstrap";
import { listFeedback, submitFeedback, type FeedbackActor } from "./feedback";
import { createInvites } from "./players";
import { acceptInvitation, getUser, signIn } from "./user";
import { Forbidden } from "./vetting";

async function truncate() {
  await execute(
    sql`truncate table encrypted_record, feedback, "user", survey, event cascade`,
  );
}

async function signInOk(token: string, password: string): Promise<Keys> {
  const result = await signIn(token, password);
  if (!result.ok) throw new Error(`sign-in failed: ${result.reason}`);
  return result.keys;
}

const now = new Date("2027-03-15T12:00:00Z");
const topics = [
  { slug: "signup", title: "Sign-up" },
  { slug: "other", title: "Other" },
];

describe("anonymous feedback", () => {
  let gmKeys: Keys;
  let inviteeKeys: Keys;
  let inviteeId: string;
  let pendingKeys: Keys;
  let pendingId: string;

  async function actor(userId: string, keys: Keys): Promise<FeedbackActor> {
    return {
      user: (await getUser(userId))!,
      keys,
      settings: await readEventSettings(keys),
      vettingCompleted: false,
      castingResult: null,
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
    const settings = await readEventSettings(gmKeys);
    await writeEventSettings({ ...settings, feedbackTopics: topics }, gmKeys);

    const [invitee, pending] = await createInvites(["inv", "pending"], gmKeys);
    inviteeKeys = await signInOk(
      invitee.url.split("/i/")[1],
      invitee.initialPassword,
    );
    inviteeId = inviteeKeys.userId;
    await acceptInvitation(
      { keys: inviteeKeys },
      { name: "Inv", newPassword: "invitee-password" },
    );
    pendingKeys = await signInOk(
      pending.url.split("/i/")[1],
      pending.initialPassword,
    );
    pendingId = pendingKeys.userId;
  });

  afterAll(async () => {
    await truncate();
    await pool.end();
  });

  it("stores feedback that only the GMs can read and that names no one", async () => {
    await submitFeedback(
      await actor(inviteeId, inviteeKeys),
      { topic: "signup", text: "  Too many questions.  " },
      now,
    );

    expect(await listFeedback(gmKeys)).toMatchObject([
      {
        topic: "signup",
        text: "Too many questions.",
        submittedOn: "2027-03-15",
      },
    ]);
    await expect(readAllFeedback(inviteeKeys)).rejects.toThrow(CannotDecrypt);

    const rows = await db.orm.public.Feedback.all();
    expect(rows).toHaveLength(1);
    expect(Object.keys(rows[0]).sort()).toEqual([
      "ciphertext",
      "gmKeyWrap",
      "id",
      "mac",
    ]);
    expect(JSON.stringify(rows[0])).not.toContain(inviteeId);
  });

  it("refuses a topic that is not defined, and empty feedback", async () => {
    const invitee = await actor(inviteeId, inviteeKeys);
    await expect(
      submitFeedback(invitee, { topic: "nope", text: "Hi" }, now),
    ).rejects.toThrow(Forbidden);
    await expect(
      submitFeedback(invitee, { topic: null, text: "Hi" }, now),
    ).rejects.toThrow(Forbidden);
    await expect(
      submitFeedback(invitee, { topic: "other", text: "   " }, now),
    ).rejects.toThrow(Forbidden);
  });

  it("refuses those who have not accepted their invitation", async () => {
    await expect(
      submitFeedback(
        await actor(pendingId, pendingKeys),
        { topic: "other", text: "Hi" },
        now,
      ),
    ).rejects.toThrow(Forbidden);
  });

  it("refuses a row whose mac does not verify", async () => {
    const [row] = await db.orm.public.Feedback.all();
    await db.orm.public.Feedback.where({ id: row.id }).update({
      mac: row.mac.replace(/^./, (c) => (c === "A" ? "B" : "A")),
    });
    await expect(listFeedback(gmKeys)).rejects.toThrow(CannotDecrypt);
  });
});

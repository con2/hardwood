/**
 * The viewer's own vetting survey response (Sign Up view). The callers (server actions) check
 * the session; the functions here re-check the permission so no path can write outside the
 * sign-up period.
 */
import { canEditSignup, type ViewerLike } from "@/auth/permissions";
import type { Keys } from "@/crypto/keys";
import { readRecord, readSurvey, writeRecord } from "@/crypto/records";
import type { Field, Values } from "@/components/forms/models";
import { validateRequired } from "@/components/forms/validateRequired";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import type { User } from "@/prisma/models";

import type { VettingResponse } from "./types";

export const emptyVettingResponse: VettingResponse = {
  values: {},
  completed: false,
};

/** The viewer is not allowed to do this (e.g. the sign-up period is not open). */
export class Forbidden extends Error {
  constructor() {
    super("Forbidden");
    this.name = "Forbidden";
  }
}

/** A signed-in user acting on their own response: a `Viewer` satisfies this. */
export interface SignupActor extends ViewerLike {
  user: ViewerLike["user"] & Pick<User, "id">;
  keys: Keys;
}

export function assertCanEditSignup(actor: ViewerLike, now: Date): void {
  if (!canEditSignup(actor, now)) throw new Forbidden();
}

/**
 * The answers to save: `incoming` (as read from the form by `processFormData`) for each
 * answerable, editable field of the current schema, `existing` for everything else. Answers to
 * fields no longer in the schema are kept (the GMs may add the field back), as are answers to
 * read-only fields, whose disabled inputs are not posted.
 */
export function mergeAnswers(
  fields: Field[],
  existing: Values,
  incoming: Values,
): Values {
  const merged: Values = { ...existing };
  for (const field of fields) {
    if (field.type === "StaticText" || field.readOnly) continue;
    if (field.slug in incoming) merged[field.slug] = incoming[field.slug];
  }
  return merged;
}

export interface SavedVettingResponse {
  response: VettingResponse;
  /** Slugs of required fields of the current schema still unanswered. */
  missing: string[];
}

async function readOwn(actor: SignupActor): Promise<VettingResponse> {
  return (
    (await readRecord(
      RecordKind.VETTING_RESPONSE,
      actor.user.id,
      actor.keys,
    )) ?? emptyVettingResponse
  );
}

async function writeOwn(
  actor: SignupActor,
  response: VettingResponse,
  fields: Field[],
): Promise<SavedVettingResponse> {
  await writeRecord(
    RecordKind.VETTING_RESPONSE,
    actor.user.id,
    response,
    ["INVITEE"],
    actor.keys,
  );
  return {
    response,
    missing: validateRequired(fields, response.values as Values),
  };
}

/**
 * Saves the answers read from the form. `readValues` gets the current schema, read here on the
 * server, so a stale form cannot write fields that no longer exist.
 */
export async function saveVettingAnswers(
  actor: SignupActor,
  readValues: (fields: Field[]) => Values,
  now: Date,
): Promise<SavedVettingResponse> {
  assertCanEditSignup(actor, now);
  const fields = await readSurvey(SurveySlug.vetting, actor.keys);
  const existing = await readOwn(actor);
  const values = mergeAnswers(
    fields,
    existing.values as Values,
    readValues(fields),
  );
  return writeOwn(actor, { values, completed: existing.completed }, fields);
}

export async function setVettingCompleted(
  actor: SignupActor,
  completed: boolean,
  now: Date,
): Promise<SavedVettingResponse> {
  assertCanEditSignup(actor, now);
  const fields = await readSurvey(SurveySlug.vetting, actor.keys);
  const existing = await readOwn(actor);
  return writeOwn(actor, { values: existing.values, completed }, fields);
}

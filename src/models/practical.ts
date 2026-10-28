/**
 * The viewer's own practical survey response (Practical view). Written to SELF + GM with the
 * viewer's own public key, as the flags are: invitees cannot unwrap the GM audience key, but
 * anyone can wrap a data key to the GM public key.
 */
import { canEditPractical, type ViewerLike } from "@/auth/permissions";
import type { Field, Values } from "@/components/forms/models";
import { validateRequired } from "@/components/forms/validateRequired";
import type { Keys } from "@/crypto/keys";
import { fromBase64Url } from "@/crypto/primitives";
import { readRecord, readSurvey, writeRecord } from "@/crypto/records";
import { RecordKind, SurveySlug } from "@/prisma/enums";
import type { User } from "@/prisma/models";

import type { PracticalResponse } from "./types";
import { Forbidden, mergeAnswers } from "./vetting";

export const emptyPracticalResponse: PracticalResponse = {
  values: {},
  completed: false,
};

/** A signed-in user acting on their own response: a `Viewer` satisfies this. */
export interface PracticalActor extends ViewerLike {
  user: ViewerLike["user"] & Pick<User, "id" | "publicKey">;
  keys: Keys;
}

export interface SavedPracticalResponse {
  response: PracticalResponse;
  /** Slugs of required fields of the current schema still unanswered. */
  missing: string[];
}

export function assertCanEditPractical(actor: ViewerLike, now: Date): void {
  if (!canEditPractical(actor, now)) throw new Forbidden();
}

/** The viewer's own response (SELF wrap); the empty one if they have none. */
export async function readOwnPractical(
  actor: Pick<PracticalActor, "user" | "keys">,
): Promise<PracticalResponse> {
  return (
    (await readRecord(
      RecordKind.PRACTICAL_RESPONSE,
      actor.user.id,
      actor.keys,
    )) ?? emptyPracticalResponse
  );
}

async function writeOwn(
  actor: PracticalActor,
  response: PracticalResponse,
  fields: Field[],
): Promise<SavedPracticalResponse> {
  await writeRecord(
    RecordKind.PRACTICAL_RESPONSE,
    actor.user.id,
    response,
    ["SELF", "GM"],
    actor.keys,
    { ownerPublicKey: fromBase64Url(actor.user.publicKey) },
  );
  return {
    response,
    missing: validateRequired(fields, response.values as Values),
  };
}

/**
 * Saves the answers read from the form. `readValues` gets the current schema, read here on the
 * server; answers to fields no longer in it are kept (`mergeAnswers`).
 */
export async function savePracticalAnswers(
  actor: PracticalActor,
  readValues: (fields: Field[]) => Values,
  now: Date,
): Promise<SavedPracticalResponse> {
  assertCanEditPractical(actor, now);
  const fields = await readSurvey(SurveySlug.practical, actor.keys);
  const existing = await readOwnPractical(actor);
  const values = mergeAnswers(
    fields,
    existing.values as Values,
    readValues(fields),
  );
  return writeOwn(actor, { values, completed: existing.completed }, fields);
}

export async function setPracticalCompleted(
  actor: PracticalActor,
  completed: boolean,
  now: Date,
): Promise<SavedPracticalResponse> {
  assertCanEditPractical(actor, now);
  const fields = await readSurvey(SurveySlug.practical, actor.keys);
  const existing = await readOwnPractical(actor);
  return writeOwn(actor, { values: existing.values, completed }, fields);
}

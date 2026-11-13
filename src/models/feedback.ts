/**
 * Anonymous feedback from invitees to the GMs (Feedback view). See `writeFeedback` in
 * `src/crypto/records.ts` for what the stored row keeps of the writer: nothing.
 */
import { canGiveFeedback, type ViewerLike } from "@/auth/permissions";
import { eventTimezone } from "@/config";
import type { AudienceKeys } from "@/crypto/keys";
import { readAllFeedback, writeFeedback } from "@/crypto/records";

import { localDate, sortFeedback } from "./feedbackEntries";
import type { Feedback } from "./types";
import { Forbidden } from "./vetting";

export const feedbackTextMaxLength = 10_000;

export interface FeedbackActor extends ViewerLike {
  keys: AudienceKeys;
}

/**
 * `topic` must be one of the event's feedback topics, or null if there are none. Throws
 * `Forbidden` if the actor may not give feedback or the input is not acceptable.
 */
export async function submitFeedback(
  actor: FeedbackActor,
  { topic, text }: Pick<Feedback, "topic" | "text">,
  now: Date,
): Promise<void> {
  if (!canGiveFeedback(actor)) throw new Forbidden();
  const topics = actor.settings.feedbackTopics;
  const topicValid =
    topics.length === 0
      ? topic === null
      : topics.some((choice) => choice.slug === topic);
  const trimmed = text.trim();
  if (!topicValid || !trimmed || trimmed.length > feedbackTextMaxLength) {
    throw new Forbidden();
  }
  await writeFeedback(
    { topic, text: trimmed, submittedOn: localDate(now, eventTimezone) },
    actor.keys,
  );
}

/** Every feedback for the GM view, newest day first. */
export async function listFeedback(
  keys: AudienceKeys,
): Promise<(Feedback & { id: string })[]> {
  return sortFeedback(await readAllFeedback(keys));
}

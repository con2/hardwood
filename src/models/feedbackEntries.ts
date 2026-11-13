/**
 * Pure helpers of the Feedback view, kept free of database imports so unit tests can use them.
 */
import type { Choice, Feedback } from "./types";

/** `YYYY-MM-DD` of `instant` in `timezone`. */
export function localDate(instant: Date, timezone: string): string {
  // The en-CA locale formats dates as ISO 8601.
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(instant);
}

/**
 * Newest day first. Within a day the order is by the random id, so that the order of the list
 * does not reveal the order of submission.
 */
export function sortFeedback<
  T extends Pick<Feedback, "submittedOn"> & { id: string },
>(entries: readonly T[]): T[] {
  return [...entries].sort(
    (a, b) =>
      b.submittedOn.localeCompare(a.submittedOn) || a.id.localeCompare(b.id),
  );
}

/** The topic's title, its slug if the GMs have since removed it, or null for no topic. */
export function topicTitle(
  topic: string | null,
  topics: readonly Choice[],
): string | null {
  if (topic === null) return null;
  return topics.find((choice) => choice.slug === topic)?.title ?? topic;
}

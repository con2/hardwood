import { toZonedDateTime } from "@con2/components/helpers";

import type { EventSettings } from "@/models/types";

/** The phase timestamps the Timeline tab edits, in chronological order. */
export const timelineKeys = [
  "signupStartsAt",
  "previewStartsAt",
  "signupEndsAt",
  "flaggingStartsAt",
  "flaggingEndsAt",
  "practicalStartsAt",
  "practicalEndsAt",
] as const satisfies (keyof EventSettings)[];

export type TimelineKey = (typeof timelineKeys)[number];

/**
 * `DateTimeInput` posts a wall-clock time (`2026-11-01T18:00`) in the time zone it was given;
 * the settings store the instant as an ISO string. Empty means not set.
 */
export function parseLocalDateTime(
  value: string,
  timezone: string,
): string | null {
  if (!value) return null;
  return toZonedDateTime(value, timezone).toInstant().toString();
}

/**
 * Phases of the event, derived purely from the decrypted event settings and the current time
 * (docs/spec.md, "Phases and timeline"). A period without a start time is closed; one without an
 * end time stays open once it has started. Casting completion is a separate, manual dimension.
 */
import type { EventSettings } from "./types";

export type PhaseSettings = Pick<
  EventSettings,
  | "signupStartsAt"
  | "previewStartsAt"
  | "signupEndsAt"
  | "flaggingStartsAt"
  | "flaggingEndsAt"
  | "practicalStartsAt"
  | "practicalEndsAt"
  | "castingCompletedAt"
>;

export interface Phase {
  /** The vetting survey is editable. */
  signupOpen: boolean;
  /** Others' completed responses are visible (to those whose own is completed). Stays true after sign-up ends. */
  previewOpen: boolean;
  /** The flagging period has started (it may have ended since). */
  flaggingStarted: boolean;
  /** Flags are editable. */
  flaggingOpen: boolean;
  /** The practical survey has opened (it may have closed since). */
  practicalStarted: boolean;
  /** The practical survey is editable. */
  practicalOpen: boolean;
  castingCompleted: boolean;
}

/** An ISO timestamp as a `Date`, or null if unset or unparseable. */
function toDate(value: string | null | undefined): Date | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function hasStarted(start: Date | null, now: Date): boolean {
  return start !== null && start.getTime() <= now.getTime();
}

/** `start <= now < end`; a missing start means closed, a missing end means open-ended. */
function isOpen(start: Date | null, end: Date | null, now: Date): boolean {
  return (
    hasStarted(start, now) && (end === null || now.getTime() < end.getTime())
  );
}

export function getPhase(settings: PhaseSettings, now: Date): Phase {
  const signupStartsAt = toDate(settings.signupStartsAt);
  const signupEndsAt = toDate(settings.signupEndsAt);
  const flaggingStartsAt = toDate(settings.flaggingStartsAt) ?? signupEndsAt;
  const flaggingEndsAt = toDate(settings.flaggingEndsAt);
  const practicalStartsAt = toDate(settings.practicalStartsAt);
  const practicalEndsAt = toDate(settings.practicalEndsAt);

  return {
    signupOpen: isOpen(signupStartsAt, signupEndsAt, now),
    previewOpen:
      hasStarted(toDate(settings.previewStartsAt), now) &&
      hasStarted(signupStartsAt, now),
    flaggingStarted: hasStarted(flaggingStartsAt, now),
    flaggingOpen: isOpen(flaggingStartsAt, flaggingEndsAt, now),
    practicalStarted: hasStarted(practicalStartsAt, now),
    practicalOpen: isOpen(practicalStartsAt, practicalEndsAt, now),
    castingCompleted: toDate(settings.castingCompletedAt) !== null,
  };
}

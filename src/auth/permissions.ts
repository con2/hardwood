/**
 * Access predicates. Pages and actions call these after `getViewer()`; the UI only hides what
 * they deny, actions re-check. They are pure: a `Viewer` satisfies `ViewerLike`, and tests build
 * one by hand. Phases come from `src/models/phase.ts`.
 */
import { getPhase } from "@/models/phase";
import type { CastingResult, EventSettings } from "@/models/types";
import { UserStatus } from "@/prisma/enums";
import type { User } from "@/prisma/models";

export interface ViewerLike {
  user: Pick<User, "status" | "isGm" | "passwordPending">;
  settings: EventSettings;
  /** The viewer's own vetting response is marked COMPLETED. */
  vettingCompleted: boolean;
  /** The viewer's own casting result; only loaded once the casting is completed. */
  castingResult: CastingResult | null;
  /** A practical survey response of the viewer's exists. */
  hasPracticalResponse: boolean;
}

export function isGm(viewer: Pick<ViewerLike, "user">): boolean {
  return viewer.user.isGm;
}

/** Has accepted their invitation and has no GM-led password reset pending. */
export function hasAccepted(viewer: Pick<ViewerLike, "user">): boolean {
  return (
    viewer.user.status !== UserStatus.INVITED && !viewer.user.passwordPending
  );
}

/** Selected for the larp, as revealed to the viewer by casting completion. */
function isSelected(viewer: ViewerLike, now: Date): boolean {
  return (
    getPhase(viewer.settings, now).castingCompleted &&
    viewer.castingResult?.result === "SELECTED"
  );
}

// ---------------------------------------------------------------------------------------------
// Sign Up

export function canSeeSignup(viewer: ViewerLike): boolean {
  return hasAccepted(viewer);
}

export function canEditSignup(viewer: ViewerLike, now: Date): boolean {
  return (
    hasAccepted(viewer) &&
    viewer.user.status === UserStatus.ENTERED &&
    getPhase(viewer.settings, now).signupOpen
  );
}

// ---------------------------------------------------------------------------------------------
// Flagging

/**
 * - `none`: no access (not accepted, own response not completed, or preview not started)
 * - `preview`: others' responses without flagging controls, before flagging starts
 * - `flagging`: flagging period open, flags editable
 * - `readonly`: responses and own flags, flags locked (flagging ended, or casting completed and
 *   selected)
 * - `names-only`: own flags with display names only (WITHDRAWN, or not selected after casting)
 */
export type FlaggingMode =
  "none" | "preview" | "flagging" | "readonly" | "names-only";

export function flaggingMode(viewer: ViewerLike, now: Date): FlaggingMode {
  const phase = getPhase(viewer.settings, now);
  if (!hasAccepted(viewer) || !viewer.vettingCompleted || !phase.previewOpen) {
    return "none";
  }
  if (
    viewer.user.status === UserStatus.WITHDRAWN ||
    (phase.castingCompleted && viewer.castingResult?.result !== "SELECTED")
  ) {
    return "names-only";
  }
  if (phase.flaggingOpen && viewer.user.status === UserStatus.ENTERED) {
    return "flagging";
  }
  if (!phase.flaggingStarted) return "preview";
  return "readonly";
}

/**
 * Why an accepted viewer whose flagging mode is `none` cannot open Flagging:
 *
 * - `withdrawn`: withdrew before they could
 * - `signupClosed`: sign-up ended without their response marked completed
 * - `notCompleted`: their response is not marked completed yet
 * - `notStarted`: their response is completed, the preview has not started
 */
export type FlaggingClosedReason =
  "withdrawn" | "signupClosed" | "notCompleted" | "notStarted";

export function flaggingClosedReason(
  viewer: ViewerLike,
  now: Date,
): FlaggingClosedReason {
  if (viewer.user.status === UserStatus.WITHDRAWN) return "withdrawn";
  if (!viewer.vettingCompleted) {
    return getPhase(viewer.settings, now).signupEnded
      ? "signupClosed"
      : "notCompleted";
  }
  return "notStarted";
}

export function canEditFlags(viewer: ViewerLike, now: Date): boolean {
  return flaggingMode(viewer, now) === "flagging";
}

// ---------------------------------------------------------------------------------------------
// Practical

/** Selected players once the practical survey opens; WITHDRAWN ones read-only if they responded. */
export function canSeePractical(viewer: ViewerLike, now: Date): boolean {
  if (!hasAccepted(viewer)) return false;
  if (!getPhase(viewer.settings, now).practicalStarted) return false;
  // Withdrawn invitees only ever see a response they already have (spec: Players, visibility).
  if (viewer.user.status === UserStatus.WITHDRAWN) {
    return viewer.hasPracticalResponse;
  }
  return isSelected(viewer, now);
}

/**
 * Why an accepted viewer for whom `canSeePractical` is false cannot open Practical:
 *
 * - `withdrawn`: withdrew without a practical response
 * - `notSelected`: the casting is completed and they were not selected
 * - `beforeCasting`: the casting is not completed
 * - `notStarted`: selected, the practical survey has not started
 */
export type PracticalClosedReason =
  "withdrawn" | "notSelected" | "beforeCasting" | "notStarted";

export function practicalClosedReason(
  viewer: ViewerLike,
  now: Date,
): PracticalClosedReason {
  if (viewer.user.status === UserStatus.WITHDRAWN) return "withdrawn";
  if (!getPhase(viewer.settings, now).castingCompleted) return "beforeCasting";
  return isSelected(viewer, now) ? "notStarted" : "notSelected";
}

export function canEditPractical(viewer: ViewerLike, now: Date): boolean {
  return (
    canSeePractical(viewer, now) &&
    getPhase(viewer.settings, now).practicalOpen &&
    viewer.user.status === UserStatus.ENTERED &&
    isSelected(viewer, now)
  );
}

// ---------------------------------------------------------------------------------------------
// Privacy

/** Every signed-in user, including INVITED ones deciding whether to accept. */
export function canSeePrivacy(_viewer: Pick<ViewerLike, "user">): boolean {
  return true;
}

export function canWithdraw(viewer: Pick<ViewerLike, "user">): boolean {
  return hasAccepted(viewer) && viewer.user.status === UserStatus.ENTERED;
}

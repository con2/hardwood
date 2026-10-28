/**
 * Access predicates. Pages and actions call these after `getViewer()`; the UI only hides what
 * they deny, actions re-check.
 *
 * TODO(M3): phase-dependent predicates (canSeeSignup, canEditSignup, canSeeFlagging,
 * canEditFlags, canSeePractical, canEditPractical) with `src/models/phase.ts`.
 */
import { UserStatus } from "@/prisma/enums";

import type { Viewer } from "./viewer";

type ViewerLike = Pick<Viewer, "user">;

export function isGm(viewer: ViewerLike): boolean {
  return viewer.user.isGm;
}

/** Has accepted their invitation and has no GM-led password reset pending. */
export function hasAccepted(viewer: ViewerLike): boolean {
  return (
    viewer.user.status !== UserStatus.INVITED && !viewer.user.passwordPending
  );
}

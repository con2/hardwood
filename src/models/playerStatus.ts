/**
 * The six-state invitee status of the Players view, and pure helpers around it. The plaintext
 * `User.status` has four states; SELECTED and NOT_SELECTED come from the GM-only
 * `PLAYER_ATTRIBUTES.castingDecision` (docs/plan.md, "Record contents and audiences").
 */
import { UserStatus } from "@/prisma/enums";

import type { CastingDecision, PlayerAttributes } from "./types";

export const uiStatuses = [
  "INVITED",
  "REVOKED",
  "ENTERED",
  "SELECTED",
  "NOT_SELECTED",
  "WITHDRAWN",
] as const;
export type UiStatus = (typeof uiStatuses)[number];

export function isUiStatus(value: unknown): value is UiStatus {
  return (uiStatuses as readonly unknown[]).includes(value);
}

export const defaultPlayerAttributes: PlayerAttributes = {
  castingDecision: null,
  characterName: "",
  characterGroup: null,
  feeCategory: null,
  feePaid: false,
};

export function uiStatus(row: {
  status: UserStatus;
  castingDecision: CastingDecision | null;
}): UiStatus {
  if (row.status === UserStatus.ENTERED && row.castingDecision) {
    return row.castingDecision;
  }
  return row.status;
}

/** INVITED ⇄ REVOKED; ENTERED, SELECTED, NOT_SELECTED and WITHDRAWN among themselves. */
const transitionGroups: readonly (readonly UiStatus[])[] = [
  ["INVITED", "REVOKED"],
  ["ENTERED", "SELECTED", "NOT_SELECTED", "WITHDRAWN"],
];

/** The statuses a GM may set for someone in `from`, including `from` itself. */
export function allowedUiStatuses(from: UiStatus): UiStatus[] {
  return [...transitionGroups.find((group) => group.includes(from))!];
}

export function canTransition(from: UiStatus, to: UiStatus): boolean {
  return allowedUiStatuses(from).includes(to);
}

/**
 * The plaintext status and casting decision that represent `to`. WITHDRAWN keeps the decision
 * (nothing is stated about the selection); INVITED and REVOKED have none.
 */
export function applyUiStatus(
  to: UiStatus,
  currentDecision: CastingDecision | null,
): { status: UserStatus; castingDecision: CastingDecision | null } {
  switch (to) {
    case "INVITED":
    case "REVOKED":
      return { status: to, castingDecision: currentDecision };
    case "ENTERED":
      return { status: UserStatus.ENTERED, castingDecision: null };
    case "SELECTED":
    case "NOT_SELECTED":
      return { status: UserStatus.ENTERED, castingDecision: to };
    case "WITHDRAWN":
      return { status: UserStatus.WITHDRAWN, castingDecision: currentDecision };
  }
}

/** At most this many invites at once. */
export const maxInvitesAtOnce = 200;
export const maxDiscordHandleLength = 100;

/** One Discord handle per line: trimmed, empty lines skipped, duplicates dropped (first kept). */
export function parseDiscordHandles(text: string): string[] {
  const seen = new Set<string>();
  const handles: string[] = [];
  for (const line of text.split(/\r?\n/)) {
    const handle = line.trim();
    if (!handle || seen.has(handle)) continue;
    seen.add(handle);
    handles.push(handle);
  }
  return handles;
}

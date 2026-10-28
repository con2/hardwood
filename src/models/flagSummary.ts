/**
 * Pure helpers around flags: the choices, who may be flagged, and the GM matrix totals.
 * Kept free of database imports so unit tests can use them.
 */
import { UserStatus } from "@/prisma/enums";

import type { Flag } from "./types";

export type FlagColour = Flag;
/** NEUTRAL is the default and the absence of a key in the `FLAGS` blob. */
export type FlagChoice = FlagColour | "NEUTRAL";

export const flagColours = [
  "RED",
  "YELLOW",
  "GREEN",
] as const satisfies readonly FlagColour[];
/** Screen order of the flagging controls. */
export const flagChoices = [
  "RED",
  "YELLOW",
  "NEUTRAL",
  "GREEN",
] as const satisfies readonly FlagChoice[];

export function isFlagColour(value: unknown): value is FlagColour {
  return (flagColours as readonly unknown[]).includes(value);
}

/**
 * Whether `target` appears in the Flagging view of `viewerId`: someone else who has accepted,
 * has not withdrawn and has marked their vetting response completed.
 */
export function isFlaggable(
  target: { id: string; status: UserStatus; vettingCompleted: boolean },
  viewerId: string,
): boolean {
  return (
    target.id !== viewerId &&
    target.status === UserStatus.ENTERED &&
    target.vettingCompleted
  );
}

export type ColourCounts = Record<FlagColour, number>;

export interface FlagTotals {
  received: ColourCounts;
  given: ColourCounts;
}

export function emptyCounts(): ColourCounts {
  return { RED: 0, YELLOW: 0, GREEN: 0 };
}

/**
 * Per-person totals of flags received and given, by colour, from the matrix rows
 * (flagger → target → colour). Everyone in `userIds` gets an entry, as does anyone in `rows`.
 */
export function summariseTotals(
  rows: Readonly<Record<string, Readonly<Record<string, FlagColour>>>>,
  userIds: Iterable<string> = [],
): Record<string, FlagTotals> {
  const totals: Record<string, FlagTotals> = {};
  const entry = (id: string) =>
    (totals[id] ??= { received: emptyCounts(), given: emptyCounts() });
  for (const id of userIds) entry(id);
  for (const [flaggerId, flags] of Object.entries(rows)) {
    entry(flaggerId);
    for (const [targetId, colour] of Object.entries(flags)) {
      if (!isFlagColour(colour) || targetId === flaggerId) continue;
      entry(flaggerId).given[colour]++;
      entry(targetId).received[colour]++;
    }
  }
  return totals;
}

/** Initials for the matrix column headers: "Anna-Liisa Virtanen" → "AV", "x" → "X". */
export function initials(label: string): string {
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  const letters =
    words.length === 1
      ? [...words[0]].slice(0, 2)
      : [[...words[0]][0], [...words[words.length - 1]][0]];
  return letters.join("").toUpperCase();
}

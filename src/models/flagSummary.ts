/**
 * Pure helpers around flags: who may be flagged and the GM matrix totals. Kept free of
 * database imports so unit tests can use them.
 */
import { UserStatus } from "@/prisma/enums";

import type { FlagSlug } from "./types";

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

export type FlagCounts = Record<FlagSlug, number>;

export interface FlagTotals {
  received: FlagCounts;
  given: FlagCounts;
}

function emptyCounts(slugs: readonly FlagSlug[]): FlagCounts {
  return Object.fromEntries(slugs.map((slug) => [slug, 0]));
}

/**
 * Per-person totals of flags received and given, by flag, from the matrix rows
 * (flagger → target → slug). Only `slugs` are counted; self-flags and other slugs are skipped.
 * Everyone in `userIds` gets an entry, as does anyone in `rows`.
 */
export function summariseTotals(
  rows: Readonly<Record<string, Readonly<Record<string, FlagSlug>>>>,
  slugs: readonly FlagSlug[],
  userIds: Iterable<string> = [],
): Record<string, FlagTotals> {
  const counted = new Set(slugs);
  const totals: Record<string, FlagTotals> = {};
  const entry = (id: string) =>
    (totals[id] ??= {
      received: emptyCounts(slugs),
      given: emptyCounts(slugs),
    });
  for (const id of userIds) entry(id);
  for (const [flaggerId, flags] of Object.entries(rows)) {
    entry(flaggerId);
    for (const [targetId, slug] of Object.entries(flags)) {
      if (!counted.has(slug) || targetId === flaggerId) continue;
      entry(flaggerId).given[slug]++;
      entry(targetId).received[slug]++;
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

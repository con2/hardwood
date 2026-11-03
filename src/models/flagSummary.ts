/**
 * Pure helpers around flags: who may be flagged and the GM summary totals. Kept free of
 * database imports so unit tests can use them.
 */
import { UserStatus } from "@/prisma/enums";

import type { UiStatus } from "./playerStatus";
import type { Flags, FlagSlug } from "./types";

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

/**
 * Whether the GM views count and show a flagger's flags: only once the flagger has marked their
 * flagging completed, as unfinished flags are private to the flagger.
 */
export function includesFlags(
  blob: Pick<Flags, "completed"> | null | undefined,
): boolean {
  return !!blob?.completed;
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

/** Which people the GM flag views count and list, by casting status. */
export const flagFilters = [
  "all",
  "hide-not-selected",
  "selected-only",
] as const;
export type FlagFilter = (typeof flagFilters)[number];

export function parseFlagFilter(value: unknown): FlagFilter {
  return (flagFilters as readonly unknown[]).includes(value)
    ? (value as FlagFilter)
    : "all";
}

export function matchesFlagFilter(
  status: UiStatus,
  filter: FlagFilter,
): boolean {
  switch (filter) {
    case "all":
      return true;
    case "hide-not-selected":
      return status !== "NOT_SELECTED";
    case "selected-only":
      return status === "SELECTED";
  }
}

/** The matrix rows (flagger → target → slug) with only the flags between `userIds`. */
export function restrictRows(
  rows: Readonly<Record<string, Readonly<Record<string, FlagSlug>>>>,
  userIds: Iterable<string>,
): Record<string, Record<string, FlagSlug>> {
  const included = new Set(userIds);
  return Object.fromEntries(
    Object.entries(rows)
      .filter(([flaggerId]) => included.has(flaggerId))
      .map(([flaggerId, flags]) => [
        flaggerId,
        Object.fromEntries(
          Object.entries(flags).filter(([targetId]) => included.has(targetId)),
        ),
      ]),
  );
}

/** Every `[flagger, target]` pair among `userIds` where the flagger gave the target `slug`. */
export function flagsAmong(
  rows: Readonly<Record<string, Readonly<Record<string, FlagSlug>>>>,
  userIds: Iterable<string>,
  slug: FlagSlug,
): [string, string][] {
  const pairs: [string, string][] = [];
  for (const [flaggerId, flags] of Object.entries(
    restrictRows(rows, userIds),
  )) {
    for (const [targetId, given] of Object.entries(flags)) {
      if (given === slug && targetId !== flaggerId)
        pairs.push([flaggerId, targetId]);
    }
  }
  return pairs;
}

/** Every `[flagger, target]` pair where someone in `userIds` gave `slug` to someone outside them. */
export function flagsLeaving(
  rows: Readonly<Record<string, Readonly<Record<string, FlagSlug>>>>,
  userIds: Iterable<string>,
  slug: FlagSlug,
): [string, string][] {
  const included = new Set(userIds);
  const pairs: [string, string][] = [];
  for (const [flaggerId, flags] of Object.entries(rows)) {
    if (!included.has(flaggerId)) continue;
    for (const [targetId, given] of Object.entries(flags)) {
      if (given === slug && !included.has(targetId))
        pairs.push([flaggerId, targetId]);
    }
  }
  return pairs;
}

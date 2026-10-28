import type { Flag } from "./types";

/**
 * Mutual green flags among the selected players: for each selected player, the other selected
 * players they flagged GREEN who also flagged them GREEN. Every selected id gets an entry
 * (possibly empty); ids are sorted for stable output. Pure: the caller decrypts the flags.
 */
export function computeMutualGreens(
  flagsByUser: ReadonlyMap<string, Readonly<Record<string, Flag>>>,
  selectedIds: Iterable<string>,
): Map<string, string[]> {
  const selected = new Set(selectedIds);
  const isGreen = (from: string, to: string) =>
    flagsByUser.get(from)?.[to] === "GREEN";

  const result = new Map<string, string[]>();
  for (const id of selected) {
    const mutual = [...selected]
      .filter(
        (other) => other !== id && isGreen(id, other) && isGreen(other, id),
      )
      .sort();
    result.set(id, mutual);
  }
  return result;
}

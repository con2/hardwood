import { greenFlagSlug } from "./flagDefinitions";
import type { FlagSlug } from "./types";

/**
 * Mutual green flags among the selected players: for each selected player, the other selected
 * players they flagged `green` who also flagged them `green`. Every selected id gets an entry
 * (possibly empty); ids are sorted for stable output. Pure: the caller decrypts the flags.
 */
export function computeMutualGreens(
  flagsByUser: ReadonlyMap<string, Readonly<Record<string, FlagSlug>>>,
  selectedIds: Iterable<string>,
): Map<string, string[]> {
  const selected = new Set(selectedIds);
  const isGreen = (from: string, to: string) =>
    flagsByUser.get(from)?.[to] === greenFlagSlug;

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

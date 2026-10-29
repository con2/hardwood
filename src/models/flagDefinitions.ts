/**
 * The event's flag definitions (`EventSettings.flags`) and the two slugs with a meaning beyond
 * display: `neutral` is the absence of a key in the `FLAGS` blob and `green` is the one shared
 * as a mutual flag after casting. Any other slug the GMs add is rendered grey. Pure and free of
 * server imports: the Flagging view is a client component.
 */
import type { EventSettings, FlagDefinition, FlagSlug } from "./types";

export const neutralFlagSlug = "neutral";
export const greenFlagSlug = "green";

const knownVariants: Record<string, string> = {
  red: "danger",
  yellow: "warning",
  [neutralFlagSlug]: "secondary",
  [greenFlagSlug]: "success",
};

/** Bootstrap colour variant of a flag; grey for slugs without a fixed colour. */
export function flagVariant(slug: FlagSlug): string {
  return knownVariants[slug] ?? "secondary";
}

export function isConfiguredFlag(
  slug: unknown,
  flags: readonly FlagDefinition[],
): slug is FlagSlug {
  return typeof slug === "string" && flags.some((flag) => flag.slug === slug);
}

/** The flags that are stored, i.e. everything but `neutral`, in screen order. */
export function nonNeutralFlags(
  flags: readonly FlagDefinition[],
): FlagDefinition[] {
  return flags.filter((flag) => flag.slug !== neutralFlagSlug);
}

export function flagsBySlug(
  flags: readonly FlagDefinition[],
): Map<FlagSlug, FlagDefinition> {
  return new Map(flags.map((flag) => [flag.slug, flag]));
}

/**
 * Shortest upper-cased title prefixes that tell the non-neutral flags apart, for the cells of
 * the GM matrix; a flag whose title is a prefix of another's falls back to its slug.
 */
export function flagAbbreviations(
  flags: readonly FlagDefinition[],
): Record<FlagSlug, string> {
  const stored = nonNeutralFlags(flags);
  const titles = stored.map((flag) => [...flag.title.toUpperCase()]);
  const result: Record<FlagSlug, string> = {};
  stored.forEach((flag, i) => {
    const own = titles[i];
    for (let length = 1; length <= own.length; length++) {
      const prefix = own.slice(0, length).join("");
      const unique = titles.every(
        (other, j) => j === i || other.slice(0, length).join("") !== prefix,
      );
      if (unique) {
        result[flag.slug] = prefix;
        return;
      }
    }
    result[flag.slug] = flag.slug;
  });
  return result;
}

/** Flags as `slug: title: definition` lines; the definition is left out when empty. */
export function formatFlagDefinitions(
  flags: readonly FlagDefinition[] | undefined,
): string {
  return (
    flags
      ?.map((flag) =>
        flag.definition
          ? `${flag.slug}: ${flag.title}: ${flag.definition}`
          : `${flag.slug}: ${flag.title}`,
      )
      .join("\n") ?? ""
  );
}

/**
 * Inverse of `formatFlagDefinitions`. Splits each non-blank line at its first two colons and
 * trims the parts; a line without a colon is both slug and title, and a line with one colon has
 * an empty definition. Slugs are not validated here (see `flagDefinitionsSchema`).
 */
export function parseFlagDefinitions(text: string): FlagDefinition[] {
  return text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const first = line.indexOf(":");
      if (first === -1) return { slug: line, title: line, definition: "" };
      const second = line.indexOf(":", first + 1);
      const slug = line.slice(0, first).trim();
      if (second === -1) {
        return { slug, title: line.slice(first + 1).trim(), definition: "" };
      }
      return {
        slug,
        title: line.slice(first + 1, second).trim(),
        definition: line.slice(second + 1).trim(),
      };
    });
}

interface FlagText {
  title: string;
  definition: string;
}

/** The translated texts of the default flags (`Translations["Flagging"]["defaultFlags"]`). */
export interface DefaultFlagMessages {
  red: FlagText;
  yellow: FlagText;
  neutral: FlagText;
  green: FlagText;
}

/** The four default flags, in screen order. */
export function defaultFlagDefinitions(
  messages: DefaultFlagMessages,
): FlagDefinition[] {
  return (["red", "yellow", neutralFlagSlug, greenFlagSlug] as const).map(
    (slug) => ({ slug, ...messages[slug] }),
  );
}

/** Settings whose `flags` are missing or empty get `defaults`. */
export function withDefaultFlags(
  settings: EventSettings,
  defaults: FlagDefinition[],
): EventSettings {
  return settings.flags?.length ? settings : { ...settings, flags: defaults };
}

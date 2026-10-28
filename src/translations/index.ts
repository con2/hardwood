/**
 * Typesafe translations: en.tsx defines the Translations type, fi.tsx must implement every key.
 * The UI language is deployment configuration (EVENT_LOCALE); there is no language switch.
 */

import { eventLocale, type SupportedLocale } from "@/config";

import type { Translations } from "./en";
import en from "./en";
import fi from "./fi";

export type { Translations };

export const languages: Record<SupportedLocale, Translations> = { en, fi };

/** Translations in the event's language, or in `locale` (for tests). */
export function getTranslations(locale: SupportedLocale = eventLocale) {
  return languages[locale];
}

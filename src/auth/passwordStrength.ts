/**
 * Password strength as a zxcvbn score from 0 to 4. The meter shows it while the password is
 * typed; Accept Invitation and Change Password refuse a password below `requiredScore`.
 */
import type { SupportedLocale } from "@/config";

export type PasswordCheck = (password: string) => number;

/** A GM's password unlocks every record, so it must be stronger than an invitee's. */
export function requiredScore(isGm: boolean): number {
  return isGm ? 3 : 2;
}

const checks = new Map<SupportedLocale, Promise<PasswordCheck>>();

/**
 * Loads zxcvbn and its dictionaries (several hundred kB) on first use, once per locale. A failed
 * load is forgotten so that the next call tries again.
 */
export function loadPasswordCheck(
  locale: SupportedLocale,
): Promise<PasswordCheck> {
  let check = checks.get(locale);
  if (!check) {
    check = createCheck(locale);
    checks.set(locale, check);
    check.catch(() => checks.delete(locale));
  }
  return check;
}

async function createCheck(locale: SupportedLocale): Promise<PasswordCheck> {
  const [core, common, language] = await Promise.all([
    import("@zxcvbn-ts/core"),
    import("@zxcvbn-ts/language-common"),
    locale === "fi"
      ? import("@zxcvbn-ts/language-fi")
      : import("@zxcvbn-ts/language-en"),
  ]);
  // English dictionaries help in Finnish too: people mix languages in passwords.
  const en =
    locale === "fi" ? await import("@zxcvbn-ts/language-en") : language;
  const zxcvbn = new core.ZxcvbnFactory({
    dictionary: {
      ...common.dictionary,
      ...en.dictionary,
      ...language.dictionary,
    },
    graphs: common.adjacencyGraphs,
    translations: language.translations,
  });
  return (password) => zxcvbn.check(password).score;
}

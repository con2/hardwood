/**
 * Environment registry. Every process.env read in the app goes through here so the
 * deployment chart and this file are the only two places that know variable names.
 */

// `next build` imports these modules to collect page data with NODE_ENV=production but without
// the deployment's secrets; only a running server must have them.
const production =
  process.env.NODE_ENV === "production" &&
  process.env.NEXT_PHASE !== "phase-production-build";

function env(name: string, fallback: string): string {
  return process.env[name] || fallback;
}

/**
 * Development gets a working default; production must set the variable. Booting with a
 * default secret would let anyone forge sessions, and a default database URL would silently
 * point production at nothing, so the process refuses to start instead.
 */
function secretEnv(name: string, devFallback: string): string {
  const value = process.env[name];
  if (value) return value;
  if (production) throw new Error(`${name} must be set in production`);
  return devFallback;
}

export const databaseUrl = secretEnv("DATABASE_URL", "postgresql:///hardwood");
export const testDatabaseUrl = env(
  "TEST_DATABASE_URL",
  "postgresql:///hardwood_test",
);

/** Key material for the encrypted session cookie. */
export const sessionSecret = secretEnv("SESSION_SECRET", "insecure-dev-secret");
/** Sessions expire after this much inactivity. */
export const sessionMaxAgeSeconds = 12 * 60 * 60;
/** A session cookie older than this is re-issued on the next request (sliding expiry). */
export const sessionRefreshAfterSeconds = 30 * 60;

/**
 * The GM audience public key (base64url) printed by `npm run init`. Sessions without the GM key
 * seal data keys to it rather than to `Event.gmPublicKey`, which anyone with write access to the
 * database could replace. Optional at startup because it exists only once the event is
 * initialised; production then refuses to seal to the GM audience, while development and tests
 * trust the Event row.
 */
export const pinnedGmPublicKey = env("GM_PUBLIC_KEY", "") || null;
export const requirePinnedGmPublicKey = production;

export const publicUrl = env("PUBLIC_URL", "http://localhost:3161");

export const supportedLocales = ["en", "fi"] as const;
export type SupportedLocale = (typeof supportedLocales)[number];

export function isSupportedLocale(value: string): value is SupportedLocale {
  return (supportedLocales as readonly string[]).includes(value);
}

function localeEnv(name: string, fallback: SupportedLocale): SupportedLocale {
  const value = env(name, fallback);
  if (!isSupportedLocale(value)) {
    throw new Error(
      `${name} must be one of ${supportedLocales.join(", ")}, got ${value}`,
    );
  }
  return value;
}

/** The event is the deployment: one instance per larp. */
export const eventName = env("EVENT_NAME", "Hardwood High 1");
/** The UI language. There is no language switch; the UI is in the language of the event. */
export const eventLocale = localeEnv("EVENT_LOCALE", "fi");
/** Phase timestamps are entered and displayed in this time zone. */
export const eventTimezone = env("EVENT_TIMEZONE", "Europe/Helsinki");
/** Signed-out visitors of the front page are sent to the larp's page on larpit.fi. */
export const larpitUrl = env(
  "LARPIT_URL",
  "https://larpit.fi/larp/01a11819-1e04-7408-83a7-1e578c9622ea",
);

/**
 * Secrets the command-line tools (`src/bin/`) accept from the environment for scripting. The
 * server never reads these.
 */
export function cliSecret(
  name: "RECOVERY_KEY" | "HARDWOOD_PASSWORD",
): string | undefined {
  return process.env[name] || undefined;
}

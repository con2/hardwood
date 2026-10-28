/**
 * Initialises the event: audience keys, recovery key, Event and Survey rows and the first GM.
 *
 *   npm run init -- <discord handle of the first GM>
 *
 * Prints the GM's invitation link, initial password and the recovery key once.
 */
import "./loadEnv";

import { AlreadyInitialized, initializeEvent } from "@/models/bootstrap";
import { invitationUrl } from "@/models/user";
import { pool } from "@/prisma/pool";
import { getTranslations } from "@/translations";

async function main() {
  const discordHandle = process.argv[2] ?? "gm";
  const t = getTranslations();

  try {
    const result = await initializeEvent({
      discordHandle,
      titles: t.VettingSurvey,
    });
    process.stdout.write(
      [
        "Event initialised.",
        "",
        "WARNING: the following are shown only once. Store the recovery key offline.",
        "",
        `First GM invitation link: ${invitationUrl(result.token)}`,
        `Initial password:         ${result.initialPassword}`,
        `Recovery key:             ${result.recoveryKey}`,
        "",
      ].join("\n"),
    );
  } catch (error) {
    if (error instanceof AlreadyInitialized) {
      process.stderr.write(
        "The event has already been initialised. Nothing done.\n",
      );
      process.exitCode = 1;
      return;
    }
    throw error;
  }
}

main()
  .catch((error: unknown) => {
    process.stderr.write(
      `init failed: ${error instanceof Error ? error.name : "error"}\n`,
    );
    process.exitCode = 1;
  })
  .finally(() => pool.end());

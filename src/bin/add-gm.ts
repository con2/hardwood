/**
 * Adds a GM. Unlocks the audience keys with an existing GM's invitation and password, or with
 * the recovery key, then either invites a new GM or promotes an existing user.
 *
 *   npm run add-gm -- --token <existing GM invite token> --discord-handle <handle>
 *   RECOVERY_KEY=… npm run add-gm -- --promote <userId>
 *
 * The password is prompted for without echo, or taken from HARDWOOD_PASSWORD for scripting.
 * Also prints the GM public key, the deployment's `GM_PUBLIC_KEY`.
 */
import "./loadEnv";

import { createInterface } from "node:readline";
import { parseArgs } from "node:util";

import { cliSecret } from "@/config";
import type { AudienceKeys } from "@/crypto/keys";
import { publicKeyFromPrivate, toBase64Url } from "@/crypto/primitives";
import { unlockWithRecoveryKey } from "@/crypto/recovery";
import {
  createInvite,
  invitationUrl,
  promoteToGm,
  signIn,
} from "@/models/user";
import { pool } from "@/prisma/pool";

const usage = `Usage:
  npm run add-gm -- [--token <GM invitation token>] (--discord-handle <handle> | --promote <userId>)
Without --token, the RECOVERY_KEY environment variable unlocks the keys.
With --token, the password is prompted for (or read from HARDWOOD_PASSWORD).`;

class UsageError extends Error {}

/** Reads a line from the terminal without echoing it. */
function promptPassword(prompt: string): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(
        new UsageError(
          "No terminal to prompt for the password; set HARDWOOD_PASSWORD.",
        ),
      );
      return;
    }
    const rl = createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: true,
    });
    const output = rl as unknown as { _writeToOutput: (s: string) => void };
    let prompted = false;
    output._writeToOutput = (s: string) => {
      if (!prompted) {
        process.stdout.write(s);
        prompted = true;
      }
    };
    rl.question(prompt, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

/** Accepts a bare token or a full invitation link. */
function parseToken(value: string): string {
  const match = /\/i\/([^/?#]+)/.exec(value);
  return match ? match[1] : value;
}

async function unlock(token: string | undefined): Promise<AudienceKeys> {
  if (token) {
    const password =
      cliSecret("HARDWOOD_PASSWORD") ?? (await promptPassword("Password: "));
    const result = await signIn(parseToken(token), password);
    if (!result.ok) throw new UsageError(`Sign-in failed (${result.reason}).`);
    if (!result.keys.gmKey)
      throw new UsageError("That invitation does not belong to a GM.");
    return result.keys;
  }
  const recoveryKey = cliSecret("RECOVERY_KEY");
  if (!recoveryKey) throw new UsageError("Give --token or set RECOVERY_KEY.");
  return unlockWithRecoveryKey(recoveryKey);
}

async function main() {
  const { values } = parseArgs({
    options: {
      token: { type: "string" },
      "discord-handle": { type: "string" },
      promote: { type: "string" },
    },
  });
  const discordHandle = values["discord-handle"];
  const promote = values.promote;
  if (!discordHandle === !promote) throw new UsageError(usage);

  const keys = await unlock(values.token);
  process.stdout.write(
    `GM public key (GM_PUBLIC_KEY): ${toBase64Url(publicKeyFromPrivate(keys.gmKey!))}\n\n`,
  );

  if (promote) {
    await promoteToGm(promote, keys);
    process.stdout.write(
      "The user is now a GM. They get the GM key on their next sign-in.\n",
    );
    return;
  }

  const invite = await createInvite(
    { discordHandle: discordHandle!, isGm: true },
    keys,
  );
  process.stdout.write(
    [
      "GM invitation created. The initial password is shown only once.",
      "",
      `Invitation link:  ${invitationUrl(invite.token)}`,
      `Initial password: ${invite.initialPassword}`,
      "",
    ].join("\n"),
  );
}

main()
  .catch((error: unknown) => {
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write(
        `add-gm failed: ${error instanceof Error ? error.name : "error"}\n`,
      );
    }
    process.exitCode = 1;
  })
  .finally(() => pool.end());

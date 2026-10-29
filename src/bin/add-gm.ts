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

import { parseArgs } from "node:util";

import { publicKeyFromPrivate, toBase64Url } from "@/crypto/primitives";
import { createInvite, invitationUrl, promoteToGm } from "@/models/user";
import { pool } from "@/prisma/pool";

import { runCli, unlock, UsageError } from "./unlock";

const usage = `Usage:
  npm run add-gm -- [--token <GM invitation token>] (--discord-handle <handle> | --promote <userId>)
Without --token, the RECOVERY_KEY environment variable unlocks the keys.
With --token, the password is prompted for (or read from HARDWOOD_PASSWORD).`;

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
    `GM public key (GM_PUBLIC_KEY): ${toBase64Url(publicKeyFromPrivate(keys.gmKey))}\n\n`,
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

runCli("add-gm", main, () => pool.end());

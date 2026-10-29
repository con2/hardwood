/**
 * Replaces an audience key, for when someone who held it must lose it (docs/operations.md,
 * "Rotating keys"). Everyone affected signs in again.
 *
 *   RECOVERY_KEY=… npm run rotate-key -- --audience gm [--demote <userId>]
 *   npm run rotate-key -- --token <GM invitation token> --audience invitee
 *
 * With the recovery key, the recovery key stays the same. With a GM's credentials it cannot be
 * re-used, so a new recovery key is generated and printed once.
 */
import "./loadEnv";

import { parseArgs } from "node:util";

import { cliSecret } from "@/config";
import { fromBase64Url, randomKey, toBase64Url } from "@/crypto/primitives";
import { GmKeyMismatch } from "@/crypto/records";
import { NeedsUpgrade, rotateGmKey, rotateInviteeKey } from "@/models/rotation";
import { pool } from "@/prisma/pool";

import { runCli, unlock, UsageError } from "./unlock";

const usage = `Usage:
  npm run rotate-key -- [--token <GM invitation token>] --audience gm [--demote <userId>]
  npm run rotate-key -- [--token <GM invitation token>] --audience invitee
Without --token, the RECOVERY_KEY environment variable unlocks the keys.`;

async function main() {
  const { values } = parseArgs({
    options: {
      token: { type: "string" },
      audience: { type: "string" },
      demote: { type: "string" },
    },
  });
  const { audience, demote } = values;
  if (audience !== "gm" && audience !== "invitee") throw new UsageError(usage);
  if (demote && audience !== "gm") throw new UsageError(usage);

  const keys = await unlock(values.token);
  const newRecoveryKey = values.token ? randomKey() : null;
  const recoveryKey =
    newRecoveryKey ?? fromBase64Url(cliSecret("RECOVERY_KEY")!.trim());

  const lines: string[] = [];
  try {
    if (audience === "gm") {
      const { gmPublicKey } = await rotateGmKey(keys, recoveryKey, { demote });
      lines.push(
        "GM key rotated. GMs sign in again. Deploy the new GM public key now (event.gmPublicKey",
        "in the chart values, GM_PUBLIC_KEY in the environment): until then invitees seal",
        "their data to the old key.",
        "",
        `GM public key: ${gmPublicKey}`,
      );
    } else {
      await rotateInviteeKey(keys, recoveryKey);
      lines.push("INVITEE key rotated. Everyone signs in again.");
    }
  } catch (error) {
    if (error instanceof NeedsUpgrade) {
      throw new UsageError("Run `npm run upgrade` first. Nothing was changed.");
    }
    if (error instanceof GmKeyMismatch) {
      throw new UsageError(
        "Event.gmPublicKey (or GM_PUBLIC_KEY) does not match the GM key. Nothing was changed.",
      );
    }
    throw error;
  }

  if (newRecoveryKey) {
    lines.push(
      "",
      "The old recovery key no longer works. The new one is shown only once; store it offline.",
      "",
      `Recovery key: ${toBase64Url(newRecoveryKey)}`,
    );
  }
  process.stdout.write(`${lines.join("\n")}\n`);
}

runCli("rotate-key", main, () => pool.end());

/**
 * Converts data written before the 2026-10-29 cryptography review fixes: binds user public keys,
 * rewrites version 1 records with record macs and padding, and pads the event settings and
 * survey schemas. Idempotent; run once per deployment after deploying the fixes.
 *
 *   RECOVERY_KEY=… npm run upgrade
 *   npm run upgrade -- --token <GM invitation token>
 *
 * Prints the GM public key for the deployment's GM_PUBLIC_KEY after checking it against the GM
 * key.
 */
import "./loadEnv";

import { parseArgs } from "node:util";

import { publicKeyFromPrivate, toBase64Url } from "@/crypto/primitives";
import { GmKeyMismatch } from "@/crypto/records";
import { upgradeStoredData } from "@/models/upgrade";
import { pool } from "@/prisma/pool";

import { runCli, unlock, UsageError } from "./unlock";

async function main() {
  const { values } = parseArgs({ options: { token: { type: "string" } } });
  const keys = await unlock(values.token);

  let report;
  try {
    report = await upgradeStoredData(keys);
  } catch (error) {
    if (!(error instanceof GmKeyMismatch)) throw error;
    throw new UsageError(
      [
        "Event.gmPublicKey (or GM_PUBLIC_KEY) does not match the GM key. Someone may have",
        "replaced it in the database. Nothing was changed; find out before deploying anything.",
      ].join("\n"),
    );
  }
  process.stdout.write(
    [
      "Event.gmPublicKey matches the GM key. Put it in the deployment (event.gmPublicKey in",
      "the chart values, GM_PUBLIC_KEY in the environment):",
      "",
      `GM public key: ${toBase64Url(publicKeyFromPrivate(keys.gmKey))}`,
      "",
      `Public keys bound:  ${report.boundKeys}`,
      `Records upgraded:   ${report.upgradedRecords} of ${report.totalRecords}`,
      "Event settings and survey schemas re-encrypted.",
      "",
    ].join("\n"),
  );
  if (report.badBindings.length > 0) {
    process.stdout.write(
      [
        "WARNING: the public key binding of these users does not verify. Someone may have",
        "replaced their public key in the database. Nothing is sealed to them until resolved:",
        ...report.badBindings.map((id) => `  ${id}`),
        "",
      ].join("\n"),
    );
    process.exitCode = 1;
  }
}

runCli("upgrade", main, () => pool.end());

/**
 * Unlocking the audience keys on the command line: with a GM's invitation and password, or with
 * the recovery key from RECOVERY_KEY.
 */
import { createInterface } from "node:readline";

import { cliSecret } from "@/config";
import type { AudienceKeys } from "@/crypto/keys";
import { unlockWithRecoveryKey } from "@/crypto/recovery";
import { signIn } from "@/models/user";

/** A mistake of the operator's; its message is printed as is. */
export class UsageError extends Error {}

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

/**
 * With `token`, signs in as that GM (password prompted for without echo, or HARDWOOD_PASSWORD);
 * without, unlocks with RECOVERY_KEY. Either way the result holds the GM key.
 */
export async function unlock(
  token: string | undefined,
): Promise<AudienceKeys & { gmKey: Uint8Array }> {
  if (token) {
    const password =
      cliSecret("HARDWOOD_PASSWORD") ?? (await promptPassword("Password: "));
    const result = await signIn(parseToken(token), password);
    if (!result.ok) throw new UsageError(`Sign-in failed (${result.reason}).`);
    const { gmKey } = result.keys;
    if (!gmKey)
      throw new UsageError("That invitation does not belong to a GM.");
    return { ...result.keys, gmKey };
  }
  const recoveryKey = cliSecret("RECOVERY_KEY");
  if (!recoveryKey) throw new UsageError("Give --token or set RECOVERY_KEY.");
  return unlockWithRecoveryKey(recoveryKey);
}

/** Runs `main`, prints usage errors as such and nothing but the error name otherwise. */
export function runCli(
  name: string,
  main: () => Promise<void>,
  end: () => Promise<void>,
) {
  main()
    .catch((error: unknown) => {
      if (error instanceof UsageError) {
        process.stderr.write(`${error.message}\n`);
      } else {
        process.stderr.write(
          `${name} failed: ${error instanceof Error ? error.name : "error"}\n`,
        );
      }
      process.exitCode = 1;
    })
    .finally(end);
}

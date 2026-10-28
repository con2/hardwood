"use client";

import { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

import type { SupportedLocale } from "@/config";

interface Messages {
  /** Labels for zxcvbn scores 0–4. */
  labels: [string, string, string, string, string];
}

interface Props {
  password: string;
  locale: SupportedLocale;
  messages: Messages;
}

type Check = (password: string) => number;

const variants = ["danger", "danger", "warning", "info", "success"] as const;

/** Loads zxcvbn and its dictionaries (several hundred kB) only when first needed. */
async function loadCheck(locale: SupportedLocale): Promise<Check> {
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

let checkPromise: Promise<Check> | null = null;

/**
 * Advisory password strength: a progress bar and a label. Never blocks weak passwords.
 * The estimator is imported on the first keystroke.
 */
export function PasswordStrengthMeter({ password, locale, messages }: Props) {
  const [result, setResult] = useState<{
    password: string;
    score: number;
  } | null>(null);

  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    checkPromise ??= loadCheck(locale);
    checkPromise.then(
      (check) => {
        if (!cancelled) setResult({ password, score: check(password) });
      },
      () => {
        // The meter is advisory; if the dictionaries fail to load, show nothing.
        checkPromise = null;
      },
    );
    return () => {
      cancelled = true;
    };
  }, [password, locale]);

  const score = password && result?.password === password ? result.score : null;

  return (
    <div className="mt-2" aria-live="polite">
      <ProgressBar
        now={score === null ? 0 : (score + 1) * 20}
        variant={score === null ? undefined : variants[score]}
        style={{ height: "0.5rem" }}
        aria-hidden
      />
      <div className="form-text">
        {score === null ? " " : messages.labels[score]}
      </div>
    </div>
  );
}

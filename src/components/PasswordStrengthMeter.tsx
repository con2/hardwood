"use client";

import { useEffect, useState } from "react";
import ProgressBar from "react-bootstrap/ProgressBar";

import { loadPasswordCheck } from "@/auth/passwordStrength";
import type { SupportedLocale } from "@/config";

interface Messages {
  /** Labels for zxcvbn scores 0–4. */
  labels: [string, string, string, string, string];
  belowRequired: string;
}

interface Props {
  password: string;
  locale: SupportedLocale;
  /** Scores below this are marked as not accepted (`requiredScore`). */
  requiredScore: number;
  messages: Messages;
}

const variants = ["danger", "danger", "warning", "info", "success"] as const;

/**
 * Password strength as a progress bar and a label, which says when the password is too weak to
 * be accepted. The server action enforces that; the meter only informs. The estimator is
 * imported on the first keystroke.
 */
export function PasswordStrengthMeter({
  password,
  locale,
  requiredScore,
  messages,
}: Props) {
  const [result, setResult] = useState<{
    password: string;
    score: number;
  } | null>(null);

  useEffect(() => {
    if (!password) return;
    let cancelled = false;
    loadPasswordCheck(locale).then(
      (check) => {
        if (!cancelled) setResult({ password, score: check(password) });
      },
      () => {
        // If the dictionaries fail to load, show nothing; the server still checks.
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
        {score === null
          ? " "
          : score < requiredScore
            ? `${messages.labels[score]} (${messages.belowRequired})`
            : messages.labels[score]}
      </div>
    </div>
  );
}

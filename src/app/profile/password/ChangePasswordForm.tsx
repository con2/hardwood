"use client";

import { useActionState, useState } from "react";

import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import type { SupportedLocale } from "@/config";
import type { Translations } from "@/translations";

import { changePasswordAction, type ChangePasswordState } from "./actions";

interface Props {
  locale: SupportedLocale;
  /** `requiredScore` for the viewer. */
  requiredScore: number;
  messages: Translations["ChangePassword"];
  strengthMessages: Translations["PasswordStrength"];
}

export function ChangePasswordForm({
  locale,
  requiredScore,
  messages,
  strengthMessages,
}: Props) {
  const [state, action, pending] = useActionState<
    ChangePasswordState,
    FormData
  >(changePasswordAction, {});
  const [password, setPassword] = useState("");

  return (
    <form action={action}>
      {state.error ? (
        <div className="alert alert-danger" role="alert">
          {messages.errors[state.error]}
        </div>
      ) : null}
      {state.ok ? (
        <div className="alert alert-success" role="status">
          {messages.success}
        </div>
      ) : null}
      <div className="mb-3">
        <label htmlFor="ChangePassword-current" className="form-label">
          {messages.currentPassword}
        </label>
        <input
          id="ChangePassword-current"
          name="currentPassword"
          type="password"
          className="form-control"
          autoComplete="current-password"
          required
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ChangePassword-new" className="form-label">
          {messages.newPassword}
        </label>
        <input
          id="ChangePassword-new"
          name="newPassword"
          type="password"
          className="form-control"
          autoComplete="new-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <PasswordStrengthMeter
          password={password}
          locale={locale}
          requiredScore={requiredScore}
          messages={strengthMessages}
        />
      </div>
      <div className="mb-3">
        <label htmlFor="ChangePassword-confirm" className="form-label">
          {messages.confirmPassword}
        </label>
        <input
          id="ChangePassword-confirm"
          name="confirmPassword"
          type="password"
          className="form-control"
          autoComplete="new-password"
          required
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {messages.submit}
      </button>
    </form>
  );
}

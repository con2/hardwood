"use client";

import { useActionState, useState } from "react";

import { PasswordStrengthMeter } from "@/components/PasswordStrengthMeter";
import type { SupportedLocale } from "@/config";
import type { Translations } from "@/translations";

import { acceptInvitationAction, type AcceptInvitationState } from "./actions";

interface Props {
  defaultName: string;
  locale: SupportedLocale;
  /** `requiredScore` for the viewer. */
  requiredScore: number;
  messages: Translations["AcceptInvitation"];
  strengthMessages: Translations["PasswordStrength"];
}

export function AcceptInvitationForm({
  defaultName,
  locale,
  requiredScore,
  messages,
  strengthMessages,
}: Props) {
  const [state, action, pending] = useActionState<
    AcceptInvitationState,
    FormData
  >(acceptInvitationAction, {});
  const [password, setPassword] = useState("");

  return (
    <form action={action}>
      {state.error ? (
        <div className="alert alert-danger" role="alert">
          {messages.errors[state.error]}
        </div>
      ) : null}
      <div className="mb-3">
        <label htmlFor="AcceptInvitation-name" className="form-label">
          {messages.name}
        </label>
        <input
          id="AcceptInvitation-name"
          name="name"
          className="form-control"
          defaultValue={defaultName}
          maxLength={200}
          autoComplete="nickname"
          required
          aria-describedby="AcceptInvitation-name-help"
        />
        <div id="AcceptInvitation-name-help" className="form-text">
          {messages.nameHelp}
        </div>
      </div>
      <div className="mb-3">
        <label htmlFor="AcceptInvitation-newPassword" className="form-label">
          {messages.newPassword}
        </label>
        <input
          id="AcceptInvitation-newPassword"
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
        <label
          htmlFor="AcceptInvitation-confirmPassword"
          className="form-label"
        >
          {messages.confirmPassword}
        </label>
        <input
          id="AcceptInvitation-confirmPassword"
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

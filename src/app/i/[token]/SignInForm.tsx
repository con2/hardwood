"use client";

import { useActionState } from "react";

import type { Translations } from "@/translations";

import { signInAction, type SignInState } from "./actions";

interface Props {
  token: string;
  messages: Translations["SignIn"];
}

export function SignInForm({ token, messages }: Props) {
  const [state, action, pending] = useActionState<SignInState, FormData>(
    signInAction.bind(null, token),
    {},
  );

  return (
    <form action={action}>
      {state.error ? (
        <div className="alert alert-danger" role="alert">
          {messages.errors[state.error]}
          {state.error === "locked" && state.lockedUntil ? (
            <>
              {" "}
              {messages.lockedUntil} <strong>{state.lockedUntil}</strong>.
            </>
          ) : null}
          {state.error === "invalid" || state.error === "locked" ? (
            <div className="mt-2">{messages.forgotPassword}</div>
          ) : null}
        </div>
      ) : null}
      <div className="mb-3">
        <label htmlFor="SignIn-password" className="form-label">
          {messages.password}
        </label>
        <input
          id="SignIn-password"
          name="password"
          type="password"
          className="form-control"
          autoComplete="current-password"
          required
          autoFocus
        />
      </div>
      <button type="submit" className="btn btn-primary" disabled={pending}>
        {messages.submit}
      </button>
    </form>
  );
}

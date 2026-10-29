"use client";

import { SubmitButton } from "@con2/components";
import { useActionState } from "react";

import type { Translations } from "@/translations";

import { type ChoicesState, saveChoices } from "../actions";

interface Props {
  characterGroups: string;
  feeCategories: string;
  flags: string;
  messages: Translations["Structure"];
  saveLabel: string;
}

const fields = ["characterGroups", "feeCategories", "flags"] as const;

export function ChoicesForm({
  characterGroups,
  feeCategories,
  flags,
  messages,
  saveLabel,
}: Props) {
  const [state, action] = useActionState<ChoicesState, FormData>(
    saveChoices,
    {},
  );
  const initial = { characterGroups, feeCategories, flags };

  return (
    // A failed save returns the submitted text; the key re-mounts the textareas with it.
    <form action={action} key={JSON.stringify(state)}>
      {state.error ? (
        <div className="alert alert-danger" role="alert">
          {state.error === "neutralRequired"
            ? messages.choices.neutralRequired
            : messages.choices.invalid}
        </div>
      ) : null}
      {fields.map((name) => (
        <div className="mb-4" key={name}>
          <label htmlFor={`Choices-${name}`} className="form-label fw-bold">
            {messages.choices[name].title}
          </label>
          <textarea
            id={`Choices-${name}`}
            name={name}
            className="form-control font-monospace"
            rows={8}
            defaultValue={state[name] ?? initial[name]}
          />
          <div className="form-text">{messages.choices[name].helpText}</div>
        </div>
      ))}
      <SubmitButton>{saveLabel}</SubmitButton>
    </form>
  );
}

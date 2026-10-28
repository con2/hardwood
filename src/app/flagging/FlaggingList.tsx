"use client";

/**
 * The interactive part of the Flagging view: the completion switch and one card per person with
 * their vetting answers and the viewer's flag. Each flag change is saved at once through
 * `setFlagAction` (one record write per click).
 */
import { useEffect, useState, useTransition } from "react";
import Alert from "react-bootstrap/Alert";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

import type { FlaggingMode } from "@/auth/permissions";
import {
  SchemaFormResponse,
  type Field,
  type Values,
} from "@/components/forms";
import {
  flagChoices,
  type FlagChoice,
  type FlagColour,
} from "@/models/flagSummary";
import type { Translations } from "@/translations";

import {
  setFlagAction,
  setFlagsCompletedAction,
  type FlaggingActionResult,
} from "./actions";

export interface FlaggingPerson {
  userId: string;
  name: string;
  discordHandle: string | null;
  /** Absent in the names-only mode. */
  values?: Record<string, unknown>;
}

type Messages = Translations["Flagging"];

interface Props {
  mode: Exclude<FlaggingMode, "none">;
  /** The vetting survey without the fields shown in the card header. */
  fields: Field[];
  people: FlaggingPerson[];
  flags: Record<string, FlagColour>;
  completed: boolean;
  mutualGreens: string[];
  messages: { Flagging: Messages; SchemaForm: Translations["SchemaForm"] };
}

const variants: Record<FlagChoice, string> = {
  RED: "danger",
  YELLOW: "warning",
  NEUTRAL: "secondary",
  GREEN: "success",
};

export function FlagBadge({
  choice,
  messages,
}: {
  choice: FlagChoice;
  messages: Messages;
}) {
  return (
    <span className={`badge text-bg-${variants[choice]}`}>
      {messages.choices[choice]}
    </span>
  );
}

type SaveState = "idle" | "saved" | "error" | "forbidden";

function useSaveState() {
  const [state, setState] = useState<SaveState>("idle");
  useEffect(() => {
    if (state !== "saved") return;
    const timeout = setTimeout(() => setState("idle"), 2000);
    return () => clearTimeout(timeout);
  }, [state]);
  return [state, setState] as const;
}

async function call(
  fn: () => Promise<FlaggingActionResult>,
): Promise<FlaggingActionResult> {
  try {
    return await fn();
  } catch {
    return { ok: false, reason: "generic" };
  }
}

function SaveIndicator({
  pending,
  state,
  messages,
}: {
  pending: boolean;
  state: SaveState;
  messages: Messages;
}) {
  if (pending) {
    return <small className="text-muted">{messages.saving}</small>;
  }
  switch (state) {
    case "saved":
      return <small className="text-success">{messages.saved}</small>;
    case "error":
      return <small className="text-danger">{messages.saveFailed}</small>;
    case "forbidden":
      return <small className="text-danger">{messages.forbidden}</small>;
    default:
      return null;
  }
}

function FlagControl({
  person,
  initial,
  messages,
}: {
  person: FlaggingPerson;
  initial: FlagChoice;
  messages: Messages;
}) {
  const [choice, setChoice] = useState<FlagChoice>(initial);
  const [pending, startTransition] = useTransition();
  const [state, setState] = useSaveState();

  const onChange = (next: FlagChoice) => {
    const previous = choice;
    setChoice(next);
    setState("idle");
    startTransition(async () => {
      const result = await call(() => setFlagAction(person.userId, next));
      if (result.ok) {
        setState("saved");
      } else {
        setChoice(previous);
        setState(result.reason === "forbidden" ? "forbidden" : "error");
      }
    });
  };

  return (
    <div className="d-flex flex-wrap align-items-center gap-2">
      <ToggleButtonGroup
        type="radio"
        name={`Flagging-${person.userId}`}
        value={choice}
        onChange={onChange}
        className="flex-wrap"
        aria-label={messages.yourFlag}
      >
        {flagChoices.map((value) => (
          <ToggleButton
            key={value}
            id={`Flagging-${person.userId}-${value}`}
            value={value}
            variant={`outline-${variants[value]}`}
            disabled={pending}
          >
            {messages.choices[value]}
          </ToggleButton>
        ))}
      </ToggleButtonGroup>
      <SaveIndicator pending={pending} state={state} messages={messages} />
    </div>
  );
}

function CompletionSwitch({
  initial,
  messages,
}: {
  initial: boolean;
  messages: Messages;
}) {
  const t = messages.completion;
  const [completed, setCompleted] = useState(initial);
  const [error, setError] = useState(false);
  const [pending, startTransition] = useTransition();

  const onChange = (value: boolean) => {
    const previous = completed;
    setCompleted(value);
    setError(false);
    startTransition(async () => {
      const result = await call(() => setFlagsCompletedAction(value));
      if (!result.ok) {
        setCompleted(previous);
        setError(true);
      }
    });
  };

  return (
    <section className="card mb-4">
      <div className="card-body">
        <h2 className="h5 card-title">{t.title}</h2>
        <ToggleButtonGroup
          type="radio"
          name="Flagging-completed"
          value={completed ? "completed" : "not-completed"}
          onChange={(value: string) => onChange(value === "completed")}
          className="d-flex flex-column flex-sm-row"
        >
          <ToggleButton
            id="Flagging-not-completed"
            value="not-completed"
            variant="outline-warning"
            className="text-start py-2"
            disabled={pending}
          >
            <strong className="d-block text-uppercase">{t.notCompleted}</strong>
            <small>{t.notCompletedHelp}</small>
          </ToggleButton>
          <ToggleButton
            id="Flagging-completed"
            value="completed"
            variant="outline-success"
            className="text-start py-2"
            disabled={pending}
          >
            <strong className="d-block text-uppercase">{t.completed}</strong>
            <small>{t.completedHelp}</small>
          </ToggleButton>
        </ToggleButtonGroup>
        {error ? (
          <Alert variant="danger" className="mt-3 mb-0">
            {t.saveFailed}
          </Alert>
        ) : null}
      </div>
    </section>
  );
}

export function FlaggingList({
  mode,
  fields,
  people,
  flags,
  completed,
  mutualGreens,
  messages,
}: Props) {
  const t = messages.Flagging;
  const mutual = new Set(mutualGreens);
  const choiceOf = (userId: string): FlagChoice => flags[userId] ?? "NEUTRAL";

  if (mode === "names-only") {
    if (people.length === 0) {
      return <div className="alert alert-info">{t.namesOnlyEmpty}</div>;
    }
    return (
      <ul className="list-group">
        {people.map((person) => (
          <li
            key={person.userId}
            className="list-group-item d-flex flex-wrap justify-content-between align-items-center gap-2"
          >
            <span>
              {person.name}
              {person.discordHandle && person.discordHandle !== person.name ? (
                <span className="text-muted ms-2">{person.discordHandle}</span>
              ) : null}
            </span>
            <FlagBadge choice={choiceOf(person.userId)} messages={t} />
          </li>
        ))}
      </ul>
    );
  }

  return (
    <>
      {mode === "flagging" ? (
        <CompletionSwitch initial={completed} messages={t} />
      ) : null}
      {people.length === 0 ? (
        <div className="alert alert-info">{t.empty}</div>
      ) : null}
      {people.map((person) => (
        <section key={person.userId} className="card mb-3">
          <div className="card-header d-flex flex-wrap align-items-baseline gap-2">
            <h2 className="h5 mb-0">{person.name}</h2>
            {person.discordHandle ? (
              <span className="text-muted">{person.discordHandle}</span>
            ) : null}
            {mutual.has(person.userId) ? (
              <span
                className="badge text-bg-success ms-auto"
                title={t.mutualGreenHelp}
              >
                {t.mutualGreen}
              </span>
            ) : null}
          </div>
          <div className="card-body">
            <SchemaFormResponse
              fields={fields}
              values={(person.values ?? {}) as Values}
              messages={messages.SchemaForm}
            />
          </div>
          <div className="card-footer">
            {mode === "flagging" ? (
              <FlagControl
                person={person}
                initial={choiceOf(person.userId)}
                messages={t}
              />
            ) : (
              <span>
                {t.yourFlag}:{" "}
                <FlagBadge choice={choiceOf(person.userId)} messages={t} />
              </span>
            )}
          </div>
        </section>
      ))}
    </>
  );
}

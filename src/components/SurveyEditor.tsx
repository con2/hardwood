"use client";

import { useState, type ReactNode } from "react";
import Alert from "react-bootstrap/Alert";
import ToggleButton from "react-bootstrap/ToggleButton";
import ToggleButtonGroup from "react-bootstrap/ToggleButtonGroup";

import AutosaveSchemaForm from "@/components/forms/AutosaveSchemaForm";
import type { Translations } from "@/translations";

/** What the save and completion actions of a survey response return. */
export type SurveySaveResult =
  | { ok: true; savedAt: string; completed: boolean; missing: string[] }
  | { ok: false; reason?: "forbidden" };

/** The texts of the completion switch; `SignUp` and `Practical` both provide them. */
export type SurveyEditorMessages = Pick<
  Translations["SignUp"],
  "completion" | "missingRequired"
>;

interface Props {
  /** Prefix for the ids and the radio group name of the completion switch. */
  id: string;
  /** Saves the whole form (`AutosaveSchemaForm`). */
  saveAction(formData: FormData): Promise<SurveySaveResult>;
  setCompletedAction(completed: boolean): Promise<SurveySaveResult>;
  /** Titles of the fields by slug, for the list of unanswered required fields. */
  fieldTitles: Record<string, string>;
  initialCompleted: boolean;
  initialMissing: string[];
  locale: string;
  messages: {
    Survey: SurveyEditorMessages;
    Autosave: Translations["Autosave"];
  };
  /** Shown in bold below the completion switch. */
  completionNote?: ReactNode;
  /** The `SchemaForm` with the viewer's answers. */
  children: ReactNode;
}

/**
 * An editable survey response (Sign Up, Practical): completion switch, required-fields warning
 * and the autosaved form.
 */
export function SurveyEditor({
  id,
  saveAction,
  setCompletedAction,
  fieldTitles,
  initialCompleted,
  initialMissing,
  locale,
  messages,
  completionNote,
  children,
}: Props) {
  const t = messages.Survey;
  const [completed, setCompleted] = useState(initialCompleted);
  const [missing, setMissing] = useState(initialMissing);
  const [completionError, setCompletionError] = useState(false);

  const onSaved = (result: SurveySaveResult) => {
    if (result.ok) setMissing(result.missing);
  };

  const onCompletedChange = async (value: boolean) => {
    const previous = completed;
    setCompleted(value);
    setCompletionError(false);
    let result: SurveySaveResult;
    try {
      result = await setCompletedAction(value);
    } catch {
      result = { ok: false };
    }
    if (result.ok) {
      setCompleted(result.completed);
      setMissing(result.missing);
    } else {
      setCompleted(previous);
      setCompletionError(true);
    }
  };

  return (
    <>
      <section className="card mb-4">
        <div className="card-body">
          <h2 className="h5 card-title">{t.completion.title}</h2>
          <ToggleButtonGroup
            type="radio"
            name={`${id}-completed`}
            value={completed ? "completed" : "not-completed"}
            onChange={(value: string) =>
              void onCompletedChange(value === "completed")
            }
            className="d-flex flex-column flex-sm-row mb-3"
          >
            <ToggleButton
              id={`${id}-not-completed`}
              value="not-completed"
              variant="outline-warning"
              className="text-start py-2"
            >
              <strong className="d-block text-uppercase">
                {t.completion.notCompleted}
              </strong>
              <small>{t.completion.notCompletedHelp}</small>
            </ToggleButton>
            <ToggleButton
              id={`${id}-completed`}
              value="completed"
              variant="outline-success"
              className="text-start py-2"
            >
              <strong className="d-block text-uppercase">
                {t.completion.completed}
              </strong>
              <small>{t.completion.completedHelp}</small>
            </ToggleButton>
          </ToggleButtonGroup>
          {completionNote ? (
            <p className="mb-0 fw-bold">{completionNote}</p>
          ) : null}
          {completionError ? (
            <Alert variant="danger" className="mt-3 mb-0">
              {t.completion.saveFailed}
            </Alert>
          ) : null}
          {completed && missing.length > 0 ? (
            <Alert variant="warning" className="mt-3 mb-0">
              {t.missingRequired}
              <ul className="mb-0">
                {missing.map((slug) => (
                  <li key={slug}>{fieldTitles[slug] || slug}</li>
                ))}
              </ul>
            </Alert>
          ) : null}
        </div>
      </section>

      <AutosaveSchemaForm
        action={saveAction}
        onSaved={onSaved}
        messages={messages.Autosave}
        locale={locale}
      >
        {children}
      </AutosaveSchemaForm>
    </>
  );
}

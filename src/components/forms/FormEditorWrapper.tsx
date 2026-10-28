"use client";

import { useRef, useState } from "react";

import type { Translations } from "@/translations";

import FormEditor from "./FormEditor";
import type { Field } from "./models";

export interface SaveFieldsResult {
  ok: boolean;
}

type SaveStatus = "idle" | "saving" | "saved" | "error";

interface Props {
  initialFields: Field[];
  locale?: string;
  messages: {
    FormEditor: Translations["FormEditor"];
    SchemaForm: Translations["SchemaForm"];
  };
  /** A server action that saves the fields. */
  onChange(newFields: Field[]): Promise<SaveFieldsResult>;
}

/**
 * Wraps FormEditor with a client component that holds the state, calls the server action on
 * every change and shows whether the latest change was saved.
 */
export default function FormEditorWrapper({
  initialFields,
  locale,
  messages,
  onChange,
}: Props) {
  const t = messages.FormEditor.saveStatus;
  const [fields, setFields] = useState(initialFields);
  const [status, setStatus] = useState<SaveStatus>("idle");
  // Only the latest save decides the indicator.
  const latestSave = useRef(0);

  const handleChange = async (newFields: Field[]) => {
    setFields(newFields);
    const save = ++latestSave.current;
    setStatus("saving");
    let result: SaveStatus;
    try {
      result = (await onChange(newFields)).ok ? "saved" : "error";
    } catch {
      result = "error";
    }
    if (save === latestSave.current) setStatus(result);
  };

  return (
    <>
      <div className="FormEditor-status mb-3" aria-live="polite">
        {status === "saving" ? (
          <span className="text-muted">
            <span
              className="spinner-border spinner-border-sm me-2"
              aria-hidden="true"
            />
            {t.saving}
          </span>
        ) : status === "saved" ? (
          <span className="text-success">{t.saved}</span>
        ) : status === "error" ? (
          <span className="text-danger" role="alert">
            {t.error}
          </span>
        ) : (
          <span className="text-muted">{t.idle}</span>
        )}
      </div>
      <FormEditor
        value={fields}
        locale={locale}
        messages={messages}
        onChange={handleChange}
      />
    </>
  );
}

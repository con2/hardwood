import { Markdown } from "@con2/components";
import { makeInputId } from "@con2/components/helpers";
import type { ReactNode } from "react";

import { Heading, type HeadingLevel } from "./Heading";
import type { Field } from "./models";

function Label({
  field,
  idPrefix,
  children,
  className = "form-label fw-bold",
}: {
  field: Field;
  idPrefix: string;
  children: ReactNode;
  className?: string;
}) {
  const inputId = makeInputId(idPrefix, field);
  return (
    <label className={className} htmlFor={inputId}>
      {children}
    </label>
  );
}

interface Props {
  field: Field;
  children?: ReactNode;
  idPrefix?: string;
  highlightReadOnlyFields?: boolean;
  /** used for StaticText.title */
  headingLevel?: HeadingLevel;
  fieldMargin?: string;
  labelClassName?: string;
}

/**
 * SchemaFormField is responsible for rendering the chrome around the
 * form input including label, help text and error message.
 */
export default function SchemaFormField({
  field,
  children,
  headingLevel,
  highlightReadOnlyFields = false,
  fieldMargin = "mb-4",
  labelClassName = "form-label fw-bold",
  idPrefix = "",
}: Props) {
  const { type } = field;
  const helpText = field.helpText ? <Markdown input={field.helpText} /> : null;

  if (type === "StaticText") {
    return (
      <>
        {field.title && <Heading level={headingLevel}>{field.title}</Heading>}
        {helpText}
        {children}
      </>
    );
  }

  // An untitled field is labelled by its slug rather than not at all.
  let title = <>{field.title || field.slug}</>;
  if (highlightReadOnlyFields && field.readOnly) {
    title = <>{title} 🔒</>;
  } else if (field.required) {
    title = <>{title}*</>;
  }

  return (
    <div className={fieldMargin}>
      <Label field={field} idPrefix={idPrefix} className={labelClassName}>
        {title}
      </Label>
      {children}
      {helpText && <div className="form-text">{helpText}</div>}
    </div>
  );
}

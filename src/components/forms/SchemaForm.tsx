import type { Translations } from "@/translations";

import type { HeadingLevel } from "./Heading";
import type { Field, Values } from "./models";
import SchemaFormField from "./SchemaFormField";
import SchemaFormInput from "./SchemaFormInput";

export interface SchemaFormProps {
  fields: Field[];
  values?: Values;
  messages: Translations["SchemaForm"];
  headingLevel?: HeadingLevel;
  readOnly?: boolean;
  className?: string;
  labelClassName?: string;
  fieldMargin?: string;
  /** For the character counters of TextArea and MarkdownEditor. */
  locale?: string;

  /** Display a lock icon next to read-only fields */
  highlightReadOnlyFields?: boolean;

  /** For when you need to render multiple SchemaForms that may have fields with the same slug */
  idPrefix?: string;
}

/**
 * Renders the inputs of a form as uncontrolled inputs: put it inside a `<form>` and read the
 * submitted `FormData` with `processFormData`. Renders no `<form>` or submit button itself.
 */
export function SchemaForm(props: SchemaFormProps) {
  const {
    fields,
    values,
    messages,
    headingLevel,
    readOnly,
    className = "",
    fieldMargin,
    labelClassName,
    locale,
    idPrefix,
    highlightReadOnlyFields,
  } = props;
  return (
    <div className={className}>
      {fields.map((field, index) => (
        <SchemaFormField
          key={field.slug || `field-${index}`}
          field={field}
          headingLevel={headingLevel}
          idPrefix={idPrefix}
          highlightReadOnlyFields={highlightReadOnlyFields}
          fieldMargin={fieldMargin}
          labelClassName={labelClassName}
        >
          <SchemaFormInput
            field={field}
            value={values?.[field.slug]}
            messages={messages}
            readOnly={readOnly}
            locale={locale}
            idPrefix={idPrefix}
          />
        </SchemaFormField>
      ))}
    </div>
  );
}

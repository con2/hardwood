import { MarkdownEditor, PatternTextInput, TextArea } from "@con2/components";
import { makeInputId } from "@con2/components/helpers";
import { Fragment } from "react";

import type { Translations } from "@/translations";

import type { Field, Value } from "./models";

interface SchemaFormInputProps {
  field: Field;
  idPrefix?: string;
  value?: Value;
  readOnly?: boolean;
  messages: Translations["SchemaForm"];
  locale?: string;
}

const defaultRows = 8;

function asString(value: Value | undefined): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

/** SchemaFormInput is responsible for rendering the actual input component. */
function SchemaFormInput({
  field,
  value,
  idPrefix = "",
  readOnly: elementReadOnly = false,
  locale = "fi",
}: SchemaFormInputProps) {
  const { type, required, readOnly: fieldReadOnly = false, slug } = field;
  const readOnly = elementReadOnly || fieldReadOnly;
  const id = makeInputId(idPrefix, field);

  switch (type) {
    case "StaticText":
      return null;
    case "SingleLineText": {
      const textInputProps = {
        className: "form-control",
        type: "text",
        defaultValue: asString(value),
        required,
        readOnly,
        id,
        name: slug,
        pattern: field.pattern,
        maxLength: field.maxLength,
      };

      // Only the custom validity message for pattern validation needs client-side
      // event handlers, so reach for the client component only when it is actually used.
      if (field.patternDescription) {
        return (
          <PatternTextInput
            {...textInputProps}
            patternDescription={field.patternDescription}
          />
        );
      }

      return <input {...textInputProps} />;
    }
    case "MultiLineText":
      // Only the character-count/custom-validity behavior needs client-side event
      // handlers, so reach for the client component only when maxLength is set.
      if (field.maxLength) {
        return (
          <TextArea
            id={id}
            name={slug}
            rows={field.rows ?? defaultRows}
            defaultValue={asString(value)}
            required={required}
            readOnly={readOnly}
            maxLength={field.maxLength}
            locale={locale}
          />
        );
      }

      return (
        <textarea
          className="form-control"
          rows={field.rows ?? defaultRows}
          defaultValue={asString(value)}
          required={required}
          readOnly={readOnly}
          id={id}
          name={slug}
        />
      );
    case "MarkdownText":
      return (
        <MarkdownEditor
          id={id}
          name={slug}
          defaultValue={asString(value)}
          required={required}
          readOnly={readOnly}
          rows={field.rows ?? defaultRows}
          locale={locale}
          maxLength={field.maxLength}
        />
      );
    case "NumberField":
      return (
        <input
          className="form-control"
          type="number"
          defaultValue={typeof value === "number" ? value : ""}
          required={required}
          readOnly={readOnly}
          id={id}
          name={slug}
          step={1}
          inputMode="numeric"
          min={field.minValue}
          max={field.maxValue}
          key={"" + value}
        />
      );
    case "SingleSelect": {
      let choices = field.choices || [];
      const presentation = field.presentation || "radio";
      const selected = asString(value);

      if (presentation === "dropdown") {
        if (!field.required) {
          choices = [{ slug: "", title: "" }, ...choices];
        }

        // As in Kompassi: key={value} forces the select to re-render when the value changes
        // under an auto-submitting form.
        return (
          <select
            className="form-select"
            required={required}
            disabled={readOnly}
            id={id}
            name={slug}
            defaultValue={selected}
            key={selected}
          >
            {choices.map((choice) => (
              <option value={choice.slug} key={choice.slug}>
                {choice.title}
              </option>
            ))}
          </select>
        );
      }

      // radio button group
      return (
        <Fragment key={selected}>
          {choices.map((choice) => {
            const choiceId = makeInputId(idPrefix, field, choice);
            return (
              <div key={choice.slug} className="mb-2">
                <input
                  className="form-check-input"
                  type="radio"
                  required={required}
                  disabled={readOnly}
                  id={choiceId}
                  name={slug}
                  value={choice.slug}
                  defaultChecked={choice.slug === selected}
                />{" "}
                <label htmlFor={choiceId} className="form-check-label">
                  {choice.title}
                </label>
              </div>
            );
          })}
        </Fragment>
      );
    }
    case "MultiSelect": {
      const chosen = Array.isArray(value) ? value : [];
      return (
        <Fragment key={JSON.stringify(value)}>
          {field.choices?.map((choice) => {
            const name = `${slug}.${choice.slug}`;
            const choiceId = makeInputId(idPrefix, field, choice);
            return (
              <div key={choice.slug} className="mb-2">
                <input
                  className="form-check-input"
                  type="checkbox"
                  defaultChecked={chosen.includes(choice.slug)}
                  disabled={readOnly}
                  id={choiceId}
                  name={name}
                />{" "}
                <label htmlFor={choiceId} className="form-check-label">
                  {choice.title}
                </label>
              </div>
            );
          })}
        </Fragment>
      );
    }
    case "RadioMatrix": {
      const questions = field.questions ?? [];
      const answers =
        value && typeof value === "object" && !Array.isArray(value)
          ? value
          : {};
      return (
        <table key={JSON.stringify(value)} className="table table-striped">
          <thead>
            <tr>
              <th></th>
              {field.choices?.map((choice) => (
                <th key={choice.slug} scope="col">
                  {choice.title}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {questions.map((question) => (
              <tr key={question.slug}>
                <th scope="row" className="fw-normal">
                  {question.title}
                </th>
                {field.choices?.map((choice) => (
                  <td key={choice.slug}>
                    <input
                      className="form-check-input"
                      type="radio"
                      required={required}
                      disabled={readOnly}
                      name={`${slug}.${question.slug}`}
                      value={choice.slug}
                      defaultChecked={choice.slug === answers[question.slug]}
                      title={`${choice.title}`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default: {
      const exhaustiveCheck: never = type;
      throw new Error(`Unknown field type ${exhaustiveCheck}`);
    }
  }
}

export default SchemaFormInput;

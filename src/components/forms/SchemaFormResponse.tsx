import { Linebreaks, Markdown } from "@con2/components";
import type { ReactNode } from "react";

import type { Translations } from "@/translations";

import type { Choice, Field, Value, Values } from "./models";
import { isAnswered } from "./validateRequired";

interface Props {
  fields: Field[];
  values: Values;
  messages: Translations["SchemaForm"];
  className?: string;
}

function choiceTitle(choices: Choice[], slug: string): string {
  return choices.find((choice) => choice.slug === slug)?.title ?? slug;
}

function FieldValue({
  field,
  value,
  messages,
}: {
  field: Exclude<Field, { type: "StaticText" }>;
  value: Value | undefined;
  messages: Translations["SchemaForm"];
}): ReactNode {
  if (!isAnswered(field, value)) {
    if (field.type !== "RadioMatrix" || !value) {
      return (
        <span className="text-muted" title={messages.noAnswer}>
          <span aria-hidden="true">—</span>
          <span className="visually-hidden">{messages.noAnswer}</span>
        </span>
      );
    }
    // A partly answered matrix is shown with its gaps.
  }

  switch (field.type) {
    case "SingleLineText":
      return String(value);
    case "MultiLineText":
      return <Linebreaks text={String(value)} />;
    case "MarkdownText":
      return <Markdown input={String(value)} />;
    case "NumberField":
      return String(value);
    case "SingleSelect":
      return choiceTitle(field.choices, String(value));
    case "MultiSelect":
      return (
        <ul className="list-unstyled mb-0">
          {(value as string[]).map((slug) => (
            <li key={slug}>{choiceTitle(field.choices, slug)}</li>
          ))}
        </ul>
      );
    case "RadioMatrix": {
      const answers = value as Record<string, string>;
      return (
        <table className="table table-sm mb-0">
          <tbody>
            {field.questions.map((question) => (
              <tr key={question.slug}>
                <th scope="row" className="fw-normal">
                  {question.title}
                </th>
                <td>
                  {answers[question.slug] ? (
                    choiceTitle(field.choices, answers[question.slug])
                  ) : (
                    <span className="text-muted" title={messages.noAnswer}>
                      —
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      );
    }
    default: {
      const exhaustiveCheck: never = field;
      throw new Error(`Unknown field ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

/**
 * The readable read-only representation of a response: each field's title, then its answer.
 * Choices are shown by title (or by slug if the choice has since been removed); answers to
 * fields no longer in the form are not shown.
 */
export function SchemaFormResponse({
  fields,
  values,
  messages,
  className = "",
}: Props) {
  return (
    <div className={`SchemaFormResponse ${className}`}>
      {fields.map((field) => {
        if (field.type === "StaticText") {
          return (
            <div key={field.slug} className="mb-3">
              {field.title ? <h3 className="h5">{field.title}</h3> : null}
              {field.helpText ? <Markdown input={field.helpText} /> : null}
            </div>
          );
        }
        return (
          <dl key={field.slug} className="mb-3">
            <dt>{field.title || field.slug}</dt>
            <dd className="mb-0">
              <FieldValue
                field={field}
                value={values[field.slug]}
                messages={messages}
              />
            </dd>
          </dl>
        );
      })}
    </div>
  );
}

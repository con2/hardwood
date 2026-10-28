import type { Field, Value, Values } from "./models";

/** Whether `value` counts as an answer to `field`. */
export function isAnswered(field: Field, value: Value | undefined): boolean {
  switch (field.type) {
    case "StaticText":
      return true;
    case "SingleLineText":
    case "MultiLineText":
    case "MarkdownText":
    case "SingleSelect":
      return typeof value === "string" && value.trim() !== "";
    case "NumberField":
      return typeof value === "number" && Number.isFinite(value);
    case "MultiSelect":
      return Array.isArray(value) && value.length > 0;
    case "RadioMatrix": {
      if (!value || typeof value !== "object" || Array.isArray(value)) {
        return false;
      }
      const answers = value;
      return field.questions.every((question) => !!answers[question.slug]);
    }
    default: {
      const exhaustiveCheck: never = field;
      throw new Error(`Unknown field ${JSON.stringify(exhaustiveCheck)}`);
    }
  }
}

/**
 * Slugs of required fields lacking an answer, in form order. A MultiSelect is missing when
 * nothing is chosen, a RadioMatrix when any question is unanswered.
 */
export function validateRequired(fields: Field[], values: Values): string[] {
  return fields
    .filter((field) => field.required && !isAnswered(field, values[field.slug]))
    .map((field) => field.slug);
}

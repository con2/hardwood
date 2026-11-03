/**
 * Aggregate counts of the choice fields of a survey for the GM summary pages. Kept free of
 * database imports so unit tests can use them.
 */
import type {
  Choice,
  Field,
  MultiSelect,
  RadioMatrix,
  SingleSelect,
  Values,
} from "@/components/forms/models";
import { isAnswered } from "@/components/forms/validateRequired";

export interface SelectSummary {
  type: "Select";
  field: SingleSelect | MultiSelect;
  /** Responses with at least one choice. */
  countResponses: number;
  countMissing: number;
  /** Choice slug → count, in choice order; slugs no longer in the field are appended. */
  counts: Record<string, number>;
}

export interface MatrixQuestionSummary {
  /** Choice slug → count, in choice order; slugs no longer in the field are appended. */
  counts: Record<string, number>;
  countMissing: number;
}

export interface MatrixSummary {
  type: "Matrix";
  field: RadioMatrix;
  countTotal: number;
  /** Question slug → its counts, in question order. */
  questions: Record<string, MatrixQuestionSummary>;
}

export type FieldSummary = SelectSummary | MatrixSummary;

function emptyCounts(choices: Choice[]): Record<string, number> {
  return Object.fromEntries(choices.map((choice) => [choice.slug, 0]));
}

function selectedSlugs(
  field: SingleSelect | MultiSelect,
  value: unknown,
): string[] {
  if (field.type === "SingleSelect") {
    return typeof value === "string" && value.trim() ? [value] : [];
  }
  return Array.isArray(value)
    ? [...new Set(value.filter((slug) => typeof slug === "string"))]
    : [];
}

function summariseSelect(
  field: SingleSelect | MultiSelect,
  responses: Values[],
): SelectSummary {
  const counts = emptyCounts(field.choices);
  let countMissing = 0;
  for (const values of responses) {
    const value = values[field.slug];
    if (!isAnswered(field, value)) {
      countMissing++;
      continue;
    }
    for (const slug of selectedSlugs(field, value)) {
      counts[slug] = (counts[slug] ?? 0) + 1;
    }
  }
  return {
    type: "Select",
    field,
    countResponses: responses.length - countMissing,
    countMissing,
    counts,
  };
}

function summariseMatrix(
  field: RadioMatrix,
  responses: Values[],
): MatrixSummary {
  const questions: Record<string, MatrixQuestionSummary> = Object.fromEntries(
    field.questions.map((question) => [
      question.slug,
      { counts: emptyCounts(field.choices), countMissing: 0 },
    ]),
  );
  for (const values of responses) {
    const value = values[field.slug];
    const answers =
      value && typeof value === "object" && !Array.isArray(value) ? value : {};
    for (const question of field.questions) {
      const summary = questions[question.slug];
      const answer = answers[question.slug];
      if (answer && typeof answer === "string") {
        summary.counts[answer] = (summary.counts[answer] ?? 0) + 1;
      } else {
        summary.countMissing++;
      }
    }
  }
  return {
    type: "Matrix",
    field,
    countTotal: responses.length,
    questions,
  };
}

/** Summaries of the choice fields of `fields`, in form order; other field types are skipped. */
export function summariseResponses(
  fields: Field[],
  responses: Values[],
): FieldSummary[] {
  return fields.flatMap((field): FieldSummary[] => {
    switch (field.type) {
      case "SingleSelect":
      case "MultiSelect":
        return [summariseSelect(field, responses)];
      case "RadioMatrix":
        return [summariseMatrix(field, responses)];
      default:
        return [];
    }
  });
}

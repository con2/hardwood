/**
 * Zod schemas for survey schemas, used by the server actions that save them and by the field
 * editor modal for early feedback. Parsing strips unknown properties.
 */
import { z } from "zod";

import { type Choice, type Field, slugPattern } from "./models";

/** Choice slugs may also contain dashes, as in Kompassi. */
export const choiceSlugPattern = /^[a-z0-9_-]+$/;

const maxTitleLength = 1000;

export const choiceSchema = z.object({
  slug: z.string().max(100).regex(choiceSlugPattern),
  title: z.string().trim().min(1).max(maxTitleLength),
});

function hasUniqueSlugs(items: { slug: string }[]): boolean {
  return new Set(items.map((item) => item.slug)).size === items.length;
}

/** Choices of a field or an event attribute: well-formed, slugs unique. May be empty. */
export const choicesSchema = z
  .array(choiceSchema)
  .max(500)
  .refine(hasUniqueSlugs, { message: "duplicateChoice" });

const nonEmptyChoices = choicesSchema.refine((choices) => choices.length > 0, {
  message: "noChoices",
});

const base = {
  slug: z.string().max(100).regex(slugPattern),
  title: z.string().max(maxTitleLength).optional(),
  helpText: z.string().max(20_000).optional(),
  required: z.boolean().optional(),
  readOnly: z.boolean().optional(),
};

const positiveInt = z.number().int().positive().optional();

export const fieldSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("StaticText"), ...base }),
  z.object({
    type: z.literal("SingleLineText"),
    ...base,
    pattern: z.string().max(1000).optional(),
    patternDescription: z.string().max(maxTitleLength).optional(),
    maxLength: positiveInt,
  }),
  z.object({
    type: z.literal("MultiLineText"),
    ...base,
    rows: positiveInt,
    maxLength: positiveInt,
  }),
  z.object({
    type: z.literal("MarkdownText"),
    ...base,
    rows: positiveInt,
    maxLength: positiveInt,
  }),
  z.object({
    type: z.literal("NumberField"),
    ...base,
    minValue: z.number().int().optional(),
    maxValue: z.number().int().optional(),
  }),
  z.object({
    type: z.literal("SingleSelect"),
    ...base,
    choices: nonEmptyChoices,
    presentation: z.enum(["dropdown", "radio"]).optional(),
  }),
  z.object({
    type: z.literal("MultiSelect"),
    ...base,
    choices: nonEmptyChoices,
  }),
  z.object({
    type: z.literal("RadioMatrix"),
    ...base,
    questions: nonEmptyChoices,
    choices: nonEmptyChoices,
  }),
]);

export const fieldsSchema = z
  .array(fieldSchema)
  .max(500)
  .refine(hasUniqueSlugs, { message: "duplicateSlug" });

// The schemas must describe exactly the model types.
true satisfies z.infer<typeof fieldSchema> extends Field ? true : never;
true satisfies z.infer<typeof choiceSchema> extends Choice ? true : never;

/** Why a field failed validation, for the editor; maps to `FormEditor.errors`. */
export type FieldError =
  "invalidSlug" | "duplicateSlug" | "invalidChoices" | "invalidField";

/** Validates one field being edited against the slugs of the other fields. */
export function validateField(
  field: Field,
  otherSlugs: string[],
): { ok: true; field: Field } | { ok: false; error: FieldError } {
  const result = fieldSchema.safeParse(field);
  if (!result.success) {
    const path = result.error.issues[0]?.path[0];
    if (path === "slug") return { ok: false, error: "invalidSlug" };
    if (path === "choices" || path === "questions") {
      return { ok: false, error: "invalidChoices" };
    }
    return { ok: false, error: "invalidField" };
  }
  if (otherSlugs.includes(result.data.slug)) {
    return { ok: false, error: "duplicateSlug" };
  }
  return { ok: true, field: result.data };
}

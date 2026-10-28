/**
 * Form field model, ported from Kompassi (`kompassi-v2-frontend/src/components/forms/models.ts`)
 * and stripped to the field types and props this app needs. Survey schemas (`Survey.ciphertext`)
 * are `Field[]`; responses are `Values` keyed by field slug.
 */

export type FieldType =
  | "SingleLineText"
  | "MultiLineText"
  | "MarkdownText"
  | "StaticText"
  | "SingleSelect"
  | "MultiSelect"
  | "RadioMatrix"
  | "NumberField";

/** The order in which the editor offers field types. */
export const fieldTypes: FieldType[] = [
  "SingleLineText",
  "MultiLineText",
  "MarkdownText",
  "StaticText",
  "SingleSelect",
  "MultiSelect",
  "RadioMatrix",
  "NumberField",
];

/** These field types represent static elements on the form and don't have values. */
export const nonValueFieldTypes: FieldType[] = ["StaticText"];

/** Field slugs are keys in responses. */
export const slugPattern = /^[a-z0-9_]+$/;

interface BaseField {
  type: FieldType;
  slug: string;
  title?: string;
  /** Markdown. */
  helpText?: string;
  required?: boolean;
  readOnly?: boolean;
}

export interface StaticText extends BaseField {
  type: "StaticText";
}

export interface SingleLineText extends BaseField {
  type: "SingleLineText";
  /** Not editable in the form editor; used by forms built in code. */
  pattern?: string;
  /** Shown when the value does not match `pattern`. */
  patternDescription?: string;
  maxLength?: number;
}

export interface MultiLineText extends BaseField {
  type: "MultiLineText";
  rows?: number;
  maxLength?: number;
}

export interface MarkdownText extends BaseField {
  type: "MarkdownText";
  rows?: number;
  maxLength?: number;
}

/** An integer. */
export interface NumberField extends BaseField {
  type: "NumberField";
  minValue?: number;
  maxValue?: number;
}

export interface Choice {
  slug: string;
  title: string;
}

export type SingleSelectPresentation = "dropdown" | "radio";

export interface SingleSelect extends BaseField {
  type: "SingleSelect";
  choices: Choice[];
  presentation?: SingleSelectPresentation;
}

export interface MultiSelect extends BaseField {
  type: "MultiSelect";
  choices: Choice[];
}

/** Choices are columns, questions are rows. */
export interface RadioMatrix extends BaseField {
  type: "RadioMatrix";
  questions: Choice[];
  choices: Choice[];
}

export type Field =
  | SingleLineText
  | MultiLineText
  | MarkdownText
  | StaticText
  | SingleSelect
  | MultiSelect
  | RadioMatrix
  | NumberField;

/** Value of a single field (without knowing its type). */
export type Value = string | number | null | string[] | Record<string, string>;
/** Values of all fields in a form. */
export type Values = Record<string, Value>;

export const emptyField: Field = {
  type: "SingleLineText",
  title: "",
  slug: "",
};

/** Vetting survey fields with a meaning beyond the survey itself. */
export const magicSlugs = {
  name: "name",
  discordHandle: "discord_handle",
} as const;

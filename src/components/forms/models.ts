/**
 * A minimal version of Kompassi's form field model for the survey schemas. The SchemaForm port
 * (a later milestone) builds on these types.
 */

export interface Choice {
  slug: string;
  title: string;
}

export type FieldType =
  | "StaticText"
  | "SingleLineText"
  | "MultiLineText"
  | "MarkdownText"
  | "NumberField"
  | "SingleSelect"
  | "MultiSelect"
  | "RadioMatrix";

export interface BaseField {
  type: FieldType;
  slug: string;
  title?: string;
  helpText?: string;
  required?: boolean;
}

export interface StaticText extends BaseField {
  type: "StaticText";
}

export interface SingleLineText extends BaseField {
  type: "SingleLineText";
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

export interface NumberField extends BaseField {
  type: "NumberField";
  minValue?: number;
  maxValue?: number;
}

export interface SingleSelect extends BaseField {
  type: "SingleSelect";
  choices: Choice[];
  presentation?: "dropdown" | "radio";
}

export interface MultiSelect extends BaseField {
  type: "MultiSelect";
  choices: Choice[];
}

export interface RadioMatrix extends BaseField {
  type: "RadioMatrix";
  questions: Choice[];
  choices: Choice[];
}

export type Field =
  | StaticText
  | SingleLineText
  | MultiLineText
  | MarkdownText
  | NumberField
  | SingleSelect
  | MultiSelect
  | RadioMatrix;

export type Value = string | number | string[] | Record<string, string> | null;
export type Values = Record<string, Value>;

/** Vetting survey fields with a meaning beyond the survey itself. */
export const magicSlugs = {
  name: "name",
  discordHandle: "discord_handle",
} as const;

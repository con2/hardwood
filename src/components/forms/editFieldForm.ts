import type { Translations } from "@/translations";

import type { Choice, Field, FieldType, Values } from "./models";
import processFormData from "./processFormData";

/** The fields of the form that edits a field of `fieldType`. */
export function getFieldEditorFields(
  fieldType: FieldType,
  messages: Translations["FormEditor"]["editFieldForm"],
): Field[] {
  const t = messages;
  const slugField: Field = {
    type: "SingleLineText",
    slug: "slug",
    required: true,
    pattern: "[a-z0-9_]+",
    patternDescription: t.slug.helpText,
    ...t.slug,
  };

  const baseFieldEditorFields: Field[] = [
    slugField,
    {
      type: "SingleLineText",
      slug: "title",
      required: false,
      ...t.title,
    },
    {
      type: "MarkdownText",
      slug: "helpText",
      required: false,
      rows: 3,
      ...t.helpText,
    },
  ];

  // Kompassi uses a SingleCheckbox here; that field type was not ported.
  const requiredField: Field = {
    type: "MultiSelect",
    slug: "required",
    required: false,
    title: t.required.title,
    choices: [{ slug: "required", title: t.required.choice }],
  };

  const editableFieldFields: Field[] = [
    ...baseFieldEditorFields,
    requiredField,
  ];

  const choicesField: Field = {
    type: "MultiLineText",
    slug: "choices",
    required: true,
    rows: 5,
    ...t.choices,
  };

  const questionsField: Field = {
    type: "MultiLineText",
    slug: "questions",
    required: true,
    rows: 5,
    ...t.questions,
  };

  const presentationField: Field = {
    type: "SingleSelect",
    slug: "presentation",
    required: true,
    presentation: "dropdown",
    title: t.presentation.title,
    choices: [
      { slug: "radio", title: t.presentation.radio },
      { slug: "dropdown", title: t.presentation.dropdown },
    ],
  };

  const maxLengthField: Field = {
    type: "NumberField",
    slug: "maxLength",
    required: false,
    minValue: 1,
    ...t.maxLength,
  };

  const minValueField: Field = {
    type: "NumberField",
    slug: "minValue",
    required: false,
    ...t.minValue,
  };

  const maxValueField: Field = {
    type: "NumberField",
    slug: "maxValue",
    required: false,
    ...t.maxValue,
  };

  switch (fieldType) {
    case "SingleSelect":
      return [...editableFieldFields, choicesField, presentationField];
    case "MultiSelect":
      return [...editableFieldFields, choicesField];
    case "RadioMatrix":
      return [...editableFieldFields, questionsField, choicesField];
    case "SingleLineText":
    case "MultiLineText":
    case "MarkdownText":
      return [...editableFieldFields, maxLengthField];
    case "NumberField":
      return [...editableFieldFields, minValueField, maxValueField];
    case "StaticText":
      return baseFieldEditorFields;
    default: {
      const exhaustiveCheck: never = fieldType;
      throw new Error(`Unknown field type ${exhaustiveCheck}`);
    }
  }
}

/** Choices as `slug: title` lines, as in Kompassi's choice editor. */
export function formatChoices(choices: Choice[] | undefined): string {
  return (
    choices?.map((choice) => `${choice.slug}: ${choice.title}`).join("\n") ?? ""
  );
}

/**
 * Inverse of `formatChoices`. Splits each non-blank line at its first colon and trims both
 * halves; a line without a colon uses the line as both slug and title. Slugs are not validated
 * here (see `choicesSchema`).
 */
export function parseChoices(choices: string): Choice[] {
  return choices
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator === -1) return { slug: line, title: line };
      return {
        slug: line.slice(0, separator).trim(),
        title: line.slice(separator + 1).trim(),
      };
    });
}

/** The values of the field editor form for `field`. */
export function fieldToValues(field: Field): Values {
  const values: Values = {
    slug: field.slug,
    title: field.title ?? "",
    helpText: field.helpText ?? "",
    required: field.required ? ["required"] : [],
  };

  switch (field.type) {
    case "SingleSelect":
      values.choices = formatChoices(field.choices);
      values.presentation = field.presentation ?? "radio";
      break;
    case "MultiSelect":
      values.choices = formatChoices(field.choices);
      break;
    case "RadioMatrix":
      values.choices = formatChoices(field.choices);
      values.questions = formatChoices(field.questions);
      break;
    case "SingleLineText":
    case "MultiLineText":
    case "MarkdownText":
      values.maxLength = field.maxLength ?? null;
      break;
    case "NumberField":
      values.minValue = field.minValue ?? null;
      values.maxValue = field.maxValue ?? null;
      break;
  }

  return values;
}

/**
 * Applies the submitted field editor form onto `initialValues`. Properties the editor does not
 * show (such as `rows` or `readOnly`) are kept; optional properties left empty are removed.
 */
export function formDataToField(
  fields: Field[],
  initialValues: Field,
  formData: FormData,
): Field {
  const values = processFormData(fields, formData);
  const result: Record<string, unknown> = { ...initialValues };

  for (const { slug } of fields) {
    const value = values[slug];
    switch (slug) {
      case "required":
        if (Array.isArray(value) && value.includes("required")) {
          result.required = true;
        } else {
          delete result.required;
        }
        break;
      case "choices":
      case "questions":
        result[slug] = parseChoices(typeof value === "string" ? value : "");
        break;
      case "slug":
        result.slug = typeof value === "string" ? value.trim() : "";
        break;
      default:
        if (value === null || value === "" || value === undefined) {
          delete result[slug];
        } else {
          result[slug] = value;
        }
    }
  }

  return result as unknown as Field;
}

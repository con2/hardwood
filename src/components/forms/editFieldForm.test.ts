import { describe, expect, it } from "vitest";

import en from "@/translations/en";

import {
  fieldToValues,
  formatChoices,
  formDataToField,
  getFieldEditorFields,
  parseChoices,
} from "./editFieldForm";
import { type Field, fieldTypes, type Values } from "./models";

const messages = en.FormEditor.editFieldForm;
const choices = [
  { slug: "yes", title: "Yes" },
  { slug: "no", title: "No: really" },
];

/** What the browser posts for a SchemaForm of `editorFields` filled with `values`. */
function toFormData(editorFields: Field[], values: Values): FormData {
  const data = new FormData();
  for (const field of editorFields) {
    const value = values[field.slug];
    if (field.type === "MultiSelect") {
      for (const slug of (value as string[]) ?? []) {
        data.append(`${field.slug}.${slug}`, "on");
      }
    } else if (value !== undefined) {
      data.append(field.slug, value === null ? "" : String(value));
    }
  }
  return data;
}

const examples: Field[] = [
  { type: "StaticText", slug: "intro", title: "Intro", helpText: "*Hi*" },
  {
    type: "SingleLineText",
    slug: "name",
    title: "Name",
    required: true,
    maxLength: 50,
  },
  { type: "MultiLineText", slug: "bio", title: "Bio", rows: 4 },
  { type: "MarkdownText", slug: "notes", helpText: "Help" },
  {
    type: "NumberField",
    slug: "age",
    title: "Age",
    minValue: 0,
    maxValue: 120,
  },
  {
    type: "SingleSelect",
    slug: "agree",
    title: "Agree?",
    choices,
    presentation: "dropdown",
  },
  { type: "MultiSelect", slug: "diets", title: "Diets", choices },
  {
    type: "RadioMatrix",
    slug: "matrix",
    title: "Matrix",
    required: true,
    questions: [{ slug: "q1", title: "Question 1" }],
    choices,
  },
];

describe("editFieldForm", () => {
  it("has an example for every field type", () => {
    expect(new Set(examples.map((field) => field.type))).toEqual(
      new Set(fieldTypes),
    );
  });

  for (const field of examples) {
    it(`round-trips ${field.type}`, () => {
      const editorFields = getFieldEditorFields(field.type, messages);
      const formData = toFormData(editorFields, fieldToValues(field));
      const result = formDataToField(editorFields, field, formData);
      expect(result).toEqual(field);
    });
  }

  it("applies edits and drops emptied optional properties", () => {
    const field = examples[1];
    const editorFields = getFieldEditorFields(field.type, messages);
    const formData = toFormData(editorFields, {
      ...fieldToValues(field),
      slug: " full_name ",
      title: "Full name",
      required: [],
      maxLength: null,
    });
    expect(formDataToField(editorFields, field, formData)).toEqual({
      type: "SingleLineText",
      slug: "full_name",
      title: "Full name",
    });
  });

  it("defaults the presentation of a single select to radio buttons", () => {
    expect(
      fieldToValues({ type: "SingleSelect", slug: "s", choices }).presentation,
    ).toBe("radio");
  });
});

describe("parseChoices", () => {
  it("parses slug: title lines", () => {
    expect(parseChoices("yes: Yes\nno: No: really")).toEqual(choices);
  });

  it("trims, skips blank lines and splits at the first colon", () => {
    expect(parseChoices("  a :  A  \r\n\n   \nb:B:C\n")).toEqual([
      { slug: "a", title: "A" },
      { slug: "b", title: "B:C" },
    ]);
  });

  it("uses a line without a colon as both slug and title", () => {
    expect(parseChoices("maybe")).toEqual([{ slug: "maybe", title: "maybe" }]);
  });

  it("is the inverse of formatChoices", () => {
    expect(formatChoices(choices)).toBe("yes: Yes\nno: No: really");
    expect(parseChoices(formatChoices(choices))).toEqual(choices);
    expect(formatChoices(undefined)).toBe("");
  });
});

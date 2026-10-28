import { describe, expect, it } from "vitest";

import type { Field } from "./models";
import processFormData from "./processFormData";

const choices = [
  { slug: "yes", title: "Yes" },
  { slug: "no", title: "No" },
];

const fields: Field[] = [
  { type: "StaticText", slug: "intro", title: "Hello" },
  { type: "SingleLineText", slug: "name" },
  { type: "MultiLineText", slug: "bio" },
  { type: "MarkdownText", slug: "notes" },
  { type: "NumberField", slug: "age" },
  { type: "SingleSelect", slug: "agree", choices },
  { type: "MultiSelect", slug: "diets", choices },
  {
    type: "RadioMatrix",
    slug: "matrix",
    questions: [
      { slug: "q1", title: "Q1" },
      { slug: "q2", title: "Q2" },
    ],
    choices,
  },
];

function formData(entries: [string, string][]): FormData {
  const data = new FormData();
  for (const [key, value] of entries) data.append(key, value);
  return data;
}

describe("processFormData", () => {
  it("reads every field type", () => {
    const values = processFormData(
      fields,
      formData([
        ["intro", "ignored"],
        ["name", "Alice"],
        ["bio", "line 1\nline 2"],
        ["notes", "**bold**"],
        ["age", "42"],
        ["agree", "yes"],
        ["diets.yes", "on"],
        ["diets.no", "off"],
        ["matrix.q1", "no"],
        ["unrelated", "x"],
      ]),
    );
    expect(values).toEqual({
      name: "Alice",
      bio: "line 1\nline 2",
      notes: "**bold**",
      age: 42,
      agree: "yes",
      diets: ["yes"],
      matrix: { q1: "no" },
    });
  });

  it("gives empty values for an empty form", () => {
    expect(processFormData(fields, formData([]))).toEqual({
      name: "",
      bio: "",
      notes: "",
      age: null,
      agree: "",
      diets: [],
      matrix: {},
    });
  });

  it("reads numbers as integers and garbage as null", () => {
    const [, , , , age] = fields;
    expect(processFormData([age], formData([["age", "3.7"]]))).toEqual({
      age: 3,
    });
    expect(processFormData([age], formData([["age", "abc"]]))).toEqual({
      age: null,
    });
    expect(processFormData([age], formData([["age", " "]]))).toEqual({
      age: null,
    });
  });
});

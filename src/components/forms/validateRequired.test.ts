import { describe, expect, it } from "vitest";

import type { Field } from "./models";
import { validateRequired } from "./validateRequired";

const choices = [
  { slug: "yes", title: "Yes" },
  { slug: "no", title: "No" },
];

const fields: Field[] = [
  { type: "StaticText", slug: "intro", required: true },
  { type: "SingleLineText", slug: "name", required: true },
  { type: "MultiLineText", slug: "bio" },
  { type: "MarkdownText", slug: "notes", required: true },
  { type: "NumberField", slug: "age", required: true },
  { type: "SingleSelect", slug: "agree", required: true, choices },
  { type: "MultiSelect", slug: "diets", required: true, choices },
  {
    type: "RadioMatrix",
    slug: "matrix",
    required: true,
    questions: [
      { slug: "q1", title: "Q1" },
      { slug: "q2", title: "Q2" },
    ],
    choices,
  },
];

describe("validateRequired", () => {
  it("lists every required field of an empty response in form order", () => {
    expect(validateRequired(fields, {})).toEqual([
      "name",
      "notes",
      "age",
      "agree",
      "diets",
      "matrix",
    ]);
  });

  it("accepts a complete response", () => {
    expect(
      validateRequired(fields, {
        name: "Alice",
        notes: "x",
        age: 0,
        agree: "no",
        diets: ["yes"],
        matrix: { q1: "yes", q2: "no" },
      }),
    ).toEqual([]);
  });

  it("treats blanks, empty choices and partial matrices as missing", () => {
    expect(
      validateRequired(fields, {
        name: "   ",
        notes: "x",
        age: null,
        agree: "",
        diets: [],
        matrix: { q1: "yes" },
      }),
    ).toEqual(["name", "age", "agree", "diets", "matrix"]);
  });
});

// @vitest-environment jsdom
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import en from "@/translations/en";

import type { Field } from "./models";
import { SchemaFormResponse } from "./SchemaFormResponse";

const choices = [
  { slug: "yes", title: "Yes please" },
  { slug: "no", title: "No thanks" },
];

const fields: Field[] = [
  { type: "StaticText", slug: "intro", title: "About you", helpText: "Hi" },
  { type: "SingleLineText", slug: "name", title: "Name" },
  { type: "MultiLineText", slug: "bio", title: "Bio" },
  { type: "NumberField", slug: "age", title: "Age" },
  { type: "SingleSelect", slug: "agree", title: "Agree", choices },
  { type: "MultiSelect", slug: "diets", title: "Diets", choices },
  {
    type: "RadioMatrix",
    slug: "matrix",
    title: "Matrix",
    questions: [
      { slug: "q1", title: "Question one" },
      { slug: "q2", title: "Question two" },
    ],
    choices,
  },
  { type: "SingleLineText", slug: "empty", title: "Empty" },
];

describe("SchemaFormResponse", () => {
  it("renders titles and readable values", () => {
    const { container } = render(
      <SchemaFormResponse
        fields={fields}
        values={{
          name: "Alice",
          bio: "first line\nsecond line",
          age: 42,
          agree: "yes",
          diets: ["no", "removed_choice"],
          matrix: { q1: "no" },
          removed_field: "not shown",
        }}
        messages={en.SchemaForm}
      />,
    );

    expect(screen.getByText("About you")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();

    // Linebreaks: one paragraph with a <br>
    const bio = screen.getByText(/first line/);
    expect(bio.tagName).toBe("P");
    expect(bio.querySelector("br")).not.toBeNull();

    // Choice titles, falling back to the slug of a removed choice
    expect(screen.getByText("Yes please")).toBeInTheDocument();
    const diets = screen.getByText("Diets").nextElementSibling as HTMLElement;
    expect(within(diets).getByText("No thanks")).toBeInTheDocument();
    expect(within(diets).getByText("removed_choice")).toBeInTheDocument();

    // Matrix as a table, unanswered questions with a dash
    const row1 = screen.getByText("Question one").closest("tr")!;
    expect(within(row1).getByText("No thanks")).toBeInTheDocument();
    const row2 = screen.getByText("Question two").closest("tr")!;
    expect(within(row2).getByText("—")).toBeInTheDocument();

    // Empty answers
    const empty = screen.getByText("Empty").nextElementSibling as HTMLElement;
    expect(within(empty).getByText(en.SchemaForm.noAnswer)).toBeInTheDocument();

    expect(container.textContent).not.toContain("not shown");
  });
});

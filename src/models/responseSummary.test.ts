import { describe, expect, it } from "vitest";

import type { Field } from "@/components/forms/models";

import { summariseResponses } from "./responseSummary";

const colour: Field = {
  type: "SingleSelect",
  slug: "colour",
  title: "Colour",
  choices: [
    { slug: "red", title: "Red" },
    { slug: "blue", title: "Blue" },
  ],
};

const themes: Field = {
  type: "MultiSelect",
  slug: "themes",
  title: "Themes",
  choices: [
    { slug: "romance", title: "Romance" },
    { slug: "violence", title: "Violence" },
    { slug: "horror", title: "Horror" },
  ],
};

const comfort: Field = {
  type: "RadioMatrix",
  slug: "comfort",
  title: "Comfort",
  questions: [
    { slug: "touch", title: "Touch" },
    { slug: "shouting", title: "Shouting" },
  ],
  choices: [
    { slug: "yes", title: "Yes" },
    { slug: "no", title: "No" },
  ],
};

describe("summariseResponses", () => {
  it("counts SingleSelect choices and missing answers", () => {
    const [summary] = summariseResponses(
      [colour],
      [{ colour: "red" }, { colour: "red" }, { colour: "" }, {}],
    );
    expect(summary).toEqual({
      type: "Select",
      field: colour,
      countResponses: 2,
      countMissing: 2,
      counts: { red: 2, blue: 0 },
    });
  });

  it("counts each MultiSelect choice once per response", () => {
    const [summary] = summariseResponses(
      [themes],
      [
        { themes: ["romance", "horror", "romance"] },
        { themes: ["romance"] },
        { themes: [] },
      ],
    );
    expect(summary).toMatchObject({
      countResponses: 2,
      countMissing: 1,
      counts: { romance: 2, violence: 0, horror: 1 },
    });
  });

  it("counts RadioMatrix answers per question", () => {
    const [summary] = summariseResponses(
      [comfort],
      [
        { comfort: { touch: "yes", shouting: "no" } },
        { comfort: { touch: "yes" } },
        {},
      ],
    );
    expect(summary).toEqual({
      type: "Matrix",
      field: comfort,
      countTotal: 3,
      questions: {
        touch: { counts: { yes: 2, no: 0 }, countMissing: 1 },
        shouting: { counts: { yes: 0, no: 1 }, countMissing: 2 },
      },
    });
  });

  it("appends choice slugs no longer in the field after the current choices", () => {
    const [summary] = summariseResponses(
      [colour],
      [{ colour: "green" }, { colour: "blue" }],
    );
    expect(summary.type === "Select" && Object.entries(summary.counts)).toEqual(
      [
        ["red", 0],
        ["blue", 1],
        ["green", 1],
      ],
    );
  });

  it("skips text, number and static fields, keeping form order", () => {
    const fields: Field[] = [
      { type: "StaticText", slug: "intro" },
      { type: "SingleLineText", slug: "name" },
      { type: "MultiLineText", slug: "story" },
      { type: "MarkdownText", slug: "notes" },
      { type: "NumberField", slug: "age" },
      comfort,
      colour,
    ];
    expect(
      summariseResponses(fields, [{ name: "A", age: 3 }]).map(
        (summary) => summary.field.slug,
      ),
    ).toEqual(["comfort", "colour"]);
  });

  it("summarises an empty response list as zeroes", () => {
    expect(summariseResponses([colour, comfort], [])).toEqual([
      {
        type: "Select",
        field: colour,
        countResponses: 0,
        countMissing: 0,
        counts: { red: 0, blue: 0 },
      },
      {
        type: "Matrix",
        field: comfort,
        countTotal: 0,
        questions: {
          touch: { counts: { yes: 0, no: 0 }, countMissing: 0 },
          shouting: { counts: { yes: 0, no: 0 }, countMissing: 0 },
        },
      },
    ]);
  });
});

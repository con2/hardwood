import { describe, expect, it } from "vitest";

import type { Field } from "./models";
import {
  choicesSchema,
  fieldsSchema,
  flagDefinitionsSchema,
  validateField,
} from "./schema";

const choices = [{ slug: "yes", title: "Yes" }];

describe("fieldsSchema", () => {
  it("accepts well-formed fields and strips unknown properties", () => {
    const parsed = fieldsSchema.parse([
      { type: "SingleLineText", slug: "name", required: true, encryptTo: [] },
      { type: "SingleSelect", slug: "agree", choices },
    ]);
    expect(parsed).toEqual([
      { type: "SingleLineText", slug: "name", required: true },
      { type: "SingleSelect", slug: "agree", choices },
    ]);
  });

  it("rejects bad slugs, duplicates, unknown types and bad choices", () => {
    const bad: unknown[][] = [
      [{ type: "SingleLineText", slug: "Name" }],
      [{ type: "SingleLineText", slug: "has-dash" }],
      [
        { type: "SingleLineText", slug: "a" },
        { type: "MultiLineText", slug: "a" },
      ],
      [{ type: "Divider", slug: "a" }],
      [{ type: "SingleSelect", slug: "a", choices: [] }],
      [{ type: "MultiSelect", slug: "a", choices: [{ slug: "x", title: "" }] }],
      [
        {
          type: "RadioMatrix",
          slug: "a",
          choices: [...choices, ...choices],
          questions: choices,
        },
      ],
    ];
    for (const fields of bad) {
      expect(fieldsSchema.safeParse(fields).success).toBe(false);
    }
  });
});

describe("choicesSchema", () => {
  it("allows no choices but not malformed ones", () => {
    expect(choicesSchema.safeParse([]).success).toBe(true);
    expect(choicesSchema.safeParse([{ slug: "a b", title: "A" }]).success).toBe(
      false,
    );
  });
});

describe("flagDefinitionsSchema", () => {
  const neutral = { slug: "neutral", title: "Neutral", definition: "" };
  const green = { slug: "green", title: "Green", definition: "Mutual" };

  it("accepts a list with neutral, custom flags included", () => {
    const parsed = flagDefinitionsSchema.safeParse([
      neutral,
      green,
      { slug: "purple", title: "Purple", definition: " Just a colour " },
    ]);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.[2].definition).toBe("Just a colour");
  });

  it("requires neutral", () => {
    const result = flagDefinitionsSchema.safeParse([green]);
    expect(result.success).toBe(false);
    expect(result.error?.issues.map((issue) => issue.message)).toContain(
      "neutralRequired",
    );
  });

  it("rejects duplicate or malformed slugs and empty titles", () => {
    expect(flagDefinitionsSchema.safeParse([neutral, neutral]).success).toBe(
      false,
    );
    expect(
      flagDefinitionsSchema.safeParse([neutral, { ...green, slug: "GREEN" }])
        .success,
    ).toBe(false);
    expect(
      flagDefinitionsSchema.safeParse([neutral, { ...green, title: " " }])
        .success,
    ).toBe(false);
  });
});

describe("validateField", () => {
  const field: Field = { type: "SingleLineText", slug: "name" };

  it("reports why a field is invalid", () => {
    expect(validateField({ ...field, slug: "Bad" }, [])).toEqual({
      ok: false,
      error: "invalidSlug",
    });
    expect(validateField(field, ["name"])).toEqual({
      ok: false,
      error: "duplicateSlug",
    });
    expect(
      validateField({ type: "MultiSelect", slug: "m", choices: [] }, []),
    ).toEqual({ ok: false, error: "invalidChoices" });
    expect(validateField(field, ["other"])).toEqual({ ok: true, field });
  });
});

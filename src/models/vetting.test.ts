import { describe, expect, it } from "vitest";

import type { Field } from "@/components/forms/models";
import processFormData from "@/components/forms/processFormData";

import { mergeAnswers } from "./vetting";

const fields: Field[] = [
  { type: "StaticText", slug: "intro", title: "Intro" },
  { type: "SingleLineText", slug: "name", title: "Name", required: true },
  { type: "SingleLineText", slug: "locked", title: "Locked", readOnly: true },
  {
    type: "MultiSelect",
    slug: "likes",
    title: "Likes",
    choices: [
      { slug: "a", title: "A" },
      { slug: "b", title: "B" },
    ],
  },
];

describe("mergeAnswers", () => {
  it("overwrites answers to the fields of the schema", () => {
    expect(
      mergeAnswers(
        fields,
        { name: "Old", likes: ["a"] },
        {
          name: "New",
          likes: [],
        },
      ),
    ).toEqual({ name: "New", likes: [] });
  });

  it("keeps answers to fields no longer in the schema", () => {
    expect(
      mergeAnswers(fields, { removed: "kept", name: "Old" }, { name: "New" }),
    ).toEqual({ removed: "kept", name: "New" });
  });

  it("ignores incoming values for static, read-only and unknown fields", () => {
    expect(
      mergeAnswers(
        fields,
        { locked: "seeded" },
        { intro: "x", locked: "changed", injected: "nope" },
      ),
    ).toEqual({ locked: "seeded" });
  });

  it("works with what processFormData reads from a form", () => {
    const formData = new FormData();
    formData.set("name", "Alice");
    formData.set("likes.b", "on");
    const merged = mergeAnswers(
      fields,
      { discord_handle: "alice", locked: "x" },
      processFormData(fields, formData),
    );
    expect(merged).toEqual({
      discord_handle: "alice",
      locked: "x",
      name: "Alice",
      likes: ["b"],
    });
  });
});

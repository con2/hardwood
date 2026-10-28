import { describe, expect, it } from "vitest";

import {
  addField,
  canMoveDown,
  canMoveUp,
  moveDown,
  moveUp,
  removeField,
  replaceField,
} from "./formEditorLogic";
import type { Field } from "./models";

const a: Field = { type: "SingleLineText", slug: "a" };
const b: Field = { type: "MultiLineText", slug: "b" };
const c: Field = { type: "NumberField", slug: "c" };
const fields = [a, b, c];
const slugs = (fs: Field[]) => fs.map((f) => f.slug);

describe("formEditorLogic", () => {
  it("moves fields up and down", () => {
    expect(slugs(moveUp(fields, "b"))).toEqual(["b", "a", "c"]);
    expect(slugs(moveDown(fields, "b"))).toEqual(["a", "c", "b"]);
    expect(canMoveUp(fields, "a")).toBe(false);
    expect(canMoveUp(fields, "c")).toBe(true);
    expect(canMoveDown(fields, "c")).toBe(false);
    expect(canMoveDown(fields, "a")).toBe(true);
  });

  it("does not mutate its input", () => {
    moveUp(fields, "c");
    removeField(fields, "a");
    expect(slugs(fields)).toEqual(["a", "b", "c"]);
  });

  it("removes fields", () => {
    expect(slugs(removeField(fields, "b"))).toEqual(["a", "c"]);
    expect(() => removeField(fields, "x")).toThrow();
  });

  it("replaces fields", () => {
    const d: Field = { type: "StaticText", slug: "d" };
    expect(replaceField(fields, "b", d)).toEqual([a, d, c]);
    expect(() => replaceField(fields, "x", d)).toThrow();
  });

  it("adds fields at the end or above another", () => {
    const d: Field = { type: "StaticText", slug: "d" };
    expect(slugs(addField(fields, d))).toEqual(["a", "b", "c", "d"]);
    expect(slugs(addField(fields, d, "a"))).toEqual(["d", "a", "b", "c"]);
    expect(slugs(addField(fields, d, "c"))).toEqual(["a", "b", "d", "c"]);
    expect(() => addField(fields, d, "x")).toThrow();
  });
});

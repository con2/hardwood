import { describe, expect, it } from "vitest";

import { computeMutualGreens } from "./mutualGreens";
import type { FlagSlug } from "./types";

function flags(entries: Record<string, Record<string, FlagSlug>>) {
  return new Map(Object.entries(entries));
}

describe("computeMutualGreens", () => {
  it("pairs selected players who green each other", () => {
    const result = computeMutualGreens(
      flags({
        a: { b: "green", c: "green" },
        b: { a: "green", c: "green" },
        c: { a: "yellow", b: "green" },
      }),
      ["a", "b", "c"],
    );
    expect(result).toEqual(
      new Map([
        ["a", ["b"]],
        ["b", ["a", "c"]],
        ["c", ["b"]],
      ]),
    );
  });

  it("ignores players who are not selected", () => {
    const result = computeMutualGreens(
      flags({
        a: { b: "green", x: "green" },
        b: { a: "green" },
        x: { a: "green" },
      }),
      ["a", "b"],
    );
    expect(result.get("a")).toEqual(["b"]);
    expect(result.has("x")).toBe(false);
  });

  it("gives every selected player an entry, also without flags", () => {
    const result = computeMutualGreens(flags({ a: { b: "green" } }), [
      "a",
      "b",
      "c",
    ]);
    expect(result).toEqual(
      new Map([
        ["a", []],
        ["b", []],
        ["c", []],
      ]),
    );
  });

  it("does not count a self-flag", () => {
    const result = computeMutualGreens(flags({ a: { a: "green" } }), ["a"]);
    expect(result.get("a")).toEqual([]);
  });
});

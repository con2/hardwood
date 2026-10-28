import { describe, expect, it } from "vitest";

import { computeMutualGreens } from "./mutualGreens";
import type { Flag } from "./types";

function flags(entries: Record<string, Record<string, Flag>>) {
  return new Map(Object.entries(entries));
}

describe("computeMutualGreens", () => {
  it("pairs selected players who green each other", () => {
    const result = computeMutualGreens(
      flags({
        a: { b: "GREEN", c: "GREEN" },
        b: { a: "GREEN", c: "GREEN" },
        c: { a: "YELLOW", b: "GREEN" },
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
        a: { b: "GREEN", x: "GREEN" },
        b: { a: "GREEN" },
        x: { a: "GREEN" },
      }),
      ["a", "b"],
    );
    expect(result.get("a")).toEqual(["b"]);
    expect(result.has("x")).toBe(false);
  });

  it("gives every selected player an entry, also without flags", () => {
    const result = computeMutualGreens(flags({ a: { b: "GREEN" } }), [
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
    const result = computeMutualGreens(flags({ a: { a: "GREEN" } }), ["a"]);
    expect(result.get("a")).toEqual([]);
  });
});

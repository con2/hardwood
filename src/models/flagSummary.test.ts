import { describe, expect, it } from "vitest";

import { UserStatus } from "@/prisma/enums";

import { initials, isFlaggable, summariseTotals } from "./flagSummary";

const slugs = ["red", "yellow", "green"];

describe("summariseTotals", () => {
  it("counts received and given flags by slug", () => {
    const totals = summariseTotals(
      {
        a: { b: "green", c: "red" },
        b: { a: "green", c: "yellow" },
        c: { a: "red", d: "green" },
      },
      slugs,
      ["a", "b", "c", "e"],
    );
    expect(totals.a).toEqual({
      received: { red: 1, yellow: 0, green: 1 },
      given: { red: 1, yellow: 0, green: 1 },
    });
    expect(totals.c.received).toEqual({ red: 1, yellow: 1, green: 0 });
    // Targets outside `userIds` still get an entry.
    expect(totals.d).toEqual({
      received: { red: 0, yellow: 0, green: 1 },
      given: { red: 0, yellow: 0, green: 0 },
    });
    // Listed users without flags get zeros.
    expect(totals.e.given).toEqual({ red: 0, yellow: 0, green: 0 });
  });

  it("ignores self-flags and slugs outside the configured ones", () => {
    const totals = summariseTotals({ a: { a: "green", b: "purple" } }, slugs);
    expect(totals.a.given).toEqual({ red: 0, yellow: 0, green: 0 });
    expect(totals.b).toBeUndefined();
  });

  it("counts a configured custom slug", () => {
    const totals = summariseTotals({ a: { b: "purple" } }, ["purple"]);
    expect(totals.b.received).toEqual({ purple: 1 });
  });
});

describe("isFlaggable", () => {
  const target = {
    id: "t",
    status: UserStatus.ENTERED,
    vettingCompleted: true,
  };
  it("accepts completed, entered others", () => {
    expect(isFlaggable(target, "v")).toBe(true);
  });
  it("refuses self, incomplete and non-entered", () => {
    expect(isFlaggable(target, "t")).toBe(false);
    expect(isFlaggable({ ...target, vettingCompleted: false }, "v")).toBe(
      false,
    );
    for (const status of [
      UserStatus.WITHDRAWN,
      UserStatus.INVITED,
      UserStatus.REVOKED,
    ]) {
      expect(isFlaggable({ ...target, status }, "v")).toBe(false);
    }
  });
});

describe("initials", () => {
  it.each([
    ["Anna-Liisa Virtanen", "AV"],
    ["Matti Kalevi Meikäläinen", "MM"],
    ["xy", "XY"],
    ["Ö", "Ö"],
    ["  ", "?"],
  ])("%s → %s", (label, expected) => {
    expect(initials(label)).toBe(expected);
  });
});

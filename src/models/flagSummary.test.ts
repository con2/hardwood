import { describe, expect, it } from "vitest";

import { UserStatus } from "@/prisma/enums";

import { initials, isFlaggable, summariseTotals } from "./flagSummary";

describe("summariseTotals", () => {
  it("counts received and given flags by colour", () => {
    const totals = summariseTotals(
      {
        a: { b: "GREEN", c: "RED" },
        b: { a: "GREEN", c: "YELLOW" },
        c: { a: "RED", d: "GREEN" },
      },
      ["a", "b", "c", "e"],
    );
    expect(totals.a).toEqual({
      received: { RED: 1, YELLOW: 0, GREEN: 1 },
      given: { RED: 1, YELLOW: 0, GREEN: 1 },
    });
    expect(totals.c.received).toEqual({ RED: 1, YELLOW: 1, GREEN: 0 });
    // Targets outside `userIds` still get an entry.
    expect(totals.d).toEqual({
      received: { RED: 0, YELLOW: 0, GREEN: 1 },
      given: { RED: 0, YELLOW: 0, GREEN: 0 },
    });
    // Listed users without flags get zeros.
    expect(totals.e.given).toEqual({ RED: 0, YELLOW: 0, GREEN: 0 });
  });

  it("ignores self-flags and unknown values", () => {
    const totals = summariseTotals({
      a: { a: "GREEN", b: "PURPLE" as "RED" },
    });
    expect(totals.a.given).toEqual({ RED: 0, YELLOW: 0, GREEN: 0 });
    expect(totals.b).toBeUndefined();
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

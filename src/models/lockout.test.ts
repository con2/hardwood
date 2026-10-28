import { describe, expect, it } from "vitest";

import { lockoutMinutes } from "./lockout";

describe("lockoutMinutes", () => {
  it("allows four failures, then backs off exponentially up to an hour", () => {
    expect([0, 1, 2, 3, 4].map(lockoutMinutes)).toEqual([0, 0, 0, 0, 0]);
    expect([5, 6, 7, 8, 9, 10].map(lockoutMinutes)).toEqual([
      1, 2, 4, 8, 16, 32,
    ]);
    expect(lockoutMinutes(11)).toBe(60);
    expect(lockoutMinutes(100)).toBe(60);
  });
});

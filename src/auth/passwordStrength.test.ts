import { describe, expect, it } from "vitest";

import { requiredScore } from "./passwordStrength";

describe("requiredScore", () => {
  it("asks more of GMs than of invitees", () => {
    expect(requiredScore(false)).toBe(2);
    expect(requiredScore(true)).toBe(3);
  });
});

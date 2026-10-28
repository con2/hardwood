import { describe, expect, it } from "vitest";

import { parseLocalDateTime } from "./keys";

describe("parseLocalDateTime", () => {
  it("reads wall-clock times in the event's time zone", () => {
    // EET (+02:00) in winter, EEST (+03:00) in summer
    expect(parseLocalDateTime("2026-12-01T18:00", "Europe/Helsinki")).toBe(
      "2026-12-01T16:00:00Z",
    );
    expect(parseLocalDateTime("2026-07-01T18:00", "Europe/Helsinki")).toBe(
      "2026-07-01T15:00:00Z",
    );
  });

  it("treats empty as not set", () => {
    expect(parseLocalDateTime("", "Europe/Helsinki")).toBeNull();
  });

  it("rejects garbage", () => {
    expect(() => parseLocalDateTime("tomorrow", "Europe/Helsinki")).toThrow();
  });
});

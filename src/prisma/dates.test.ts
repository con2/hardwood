import { describe, expect, it } from "vitest";

import { formatDates, parseDates } from "./dates";

describe("parseDates", () => {
  it("parses timestamp fields and leaves others alone", () => {
    const row = parseDates({
      id: "x",
      createdAt: "2026-10-28T12:00:00.000Z",
      lockedUntil: null,
      kdfParams: { createdAt: "not a date" },
    });
    expect(row.createdAt).toBeInstanceOf(Date);
    expect(row.createdAt.toISOString()).toBe("2026-10-28T12:00:00.000Z");
    expect(row.lockedUntil).toBeNull();
    expect(row.kdfParams).toEqual({ createdAt: "not a date" });
    expect(row.id).toBe("x");
  });

  it("parses the PostgreSQL text format the driver returns", () => {
    const row = parseDates({ updatedAt: "2026-10-28 22:11:25.123+01" });
    expect(row.updatedAt.toISOString()).toBe("2026-10-28T21:11:25.123Z");
  });

  it("round-trips through formatDates", () => {
    const date = new Date("2026-01-01T00:00:00.000Z");
    expect(formatDates({ lockedUntil: date })).toEqual({
      lockedUntil: "2026-01-01T00:00:00.000Z",
    });
  });
});

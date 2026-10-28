import { describe, expect, it } from "vitest";

import {
  allowedUiStatuses,
  applyUiStatus,
  canTransition,
  parseDiscordHandles,
  uiStatus,
  uiStatuses,
} from "./playerStatus";

describe("uiStatus", () => {
  it("passes the plaintext status through without a decision", () => {
    for (const status of [
      "INVITED",
      "REVOKED",
      "ENTERED",
      "WITHDRAWN",
    ] as const) {
      expect(uiStatus({ status, castingDecision: null })).toBe(status);
    }
  });

  it("shows the casting decision of an entered invitee", () => {
    expect(uiStatus({ status: "ENTERED", castingDecision: "SELECTED" })).toBe(
      "SELECTED",
    );
    expect(
      uiStatus({ status: "ENTERED", castingDecision: "NOT_SELECTED" }),
    ).toBe("NOT_SELECTED");
  });

  it("shows WITHDRAWN regardless of a decision", () => {
    expect(uiStatus({ status: "WITHDRAWN", castingDecision: "SELECTED" })).toBe(
      "WITHDRAWN",
    );
  });
});

describe("transitions", () => {
  it("allows INVITED ⇄ REVOKED only", () => {
    expect(allowedUiStatuses("INVITED")).toEqual(["INVITED", "REVOKED"]);
    expect(allowedUiStatuses("REVOKED")).toEqual(["INVITED", "REVOKED"]);
    expect(canTransition("INVITED", "ENTERED")).toBe(false);
    expect(canTransition("REVOKED", "SELECTED")).toBe(false);
  });

  it("allows the accepted states among themselves", () => {
    const accepted = ["ENTERED", "SELECTED", "NOT_SELECTED", "WITHDRAWN"];
    for (const from of accepted) {
      expect(allowedUiStatuses(from as never)).toEqual(accepted);
    }
    expect(canTransition("WITHDRAWN", "INVITED")).toBe(false);
    expect(canTransition("SELECTED", "REVOKED")).toBe(false);
  });

  it("covers every status", () => {
    for (const status of uiStatuses) {
      expect(allowedUiStatuses(status)).toContain(status);
    }
  });
});

describe("applyUiStatus", () => {
  it("maps selection onto ENTERED plus a decision", () => {
    expect(applyUiStatus("SELECTED", null)).toEqual({
      status: "ENTERED",
      castingDecision: "SELECTED",
    });
    expect(applyUiStatus("NOT_SELECTED", "SELECTED")).toEqual({
      status: "ENTERED",
      castingDecision: "NOT_SELECTED",
    });
  });

  it("clears the decision on ENTERED and keeps it on WITHDRAWN", () => {
    expect(applyUiStatus("ENTERED", "SELECTED")).toEqual({
      status: "ENTERED",
      castingDecision: null,
    });
    expect(applyUiStatus("WITHDRAWN", "SELECTED")).toEqual({
      status: "WITHDRAWN",
      castingDecision: "SELECTED",
    });
  });
});

describe("parseDiscordHandles", () => {
  it("trims, skips empty lines and drops duplicates", () => {
    expect(
      parseDiscordHandles("  aino \n\n\r\nbertta\r\naino\n  \ncecilia  "),
    ).toEqual(["aino", "bertta", "cecilia"]);
  });

  it("returns nothing for blank input", () => {
    expect(parseDiscordHandles(" \n \n")).toEqual([]);
  });
});

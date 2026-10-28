import { describe, expect, it } from "vitest";

import { UserStatus } from "@/prisma/enums";

import { statusBannerKind } from "./StatusBanner";

describe("statusBannerKind", () => {
  it("shows nothing before casting completion", () => {
    expect(statusBannerKind(UserStatus.ENTERED, null)).toBeNull();
  });

  it("shows the casting result once there is one", () => {
    expect(statusBannerKind(UserStatus.ENTERED, { result: "SELECTED" })).toBe(
      "selected",
    );
    expect(
      statusBannerKind(UserStatus.ENTERED, { result: "NOT_SELECTED" }),
    ).toBe("notSelected");
  });

  it("lets WITHDRAWN take precedence over a casting result", () => {
    expect(statusBannerKind(UserStatus.WITHDRAWN, null)).toBe("withdrawn");
    expect(statusBannerKind(UserStatus.WITHDRAWN, { result: "SELECTED" })).toBe(
      "withdrawn",
    );
  });
});

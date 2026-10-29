import { describe, expect, it } from "vitest";

import {
  defaultEventSettings,
  type CastingResult,
  type EventSettings,
} from "@/models/types";
import { UserStatus } from "@/prisma/enums";

import {
  canEditFlags,
  canEditPractical,
  practicalClosedReason,
  canEditSignup,
  canSeePractical,
  flaggingClosedReason,
  canSeePrivacy,
  canSeeSignup,
  canWithdraw,
  flaggingMode,
  hasAccepted,
  type ViewerLike,
} from "./permissions";

const day = (n: number) => new Date(Date.UTC(2027, 0, n, 12)).toISOString();
const at = (n: number) => new Date(day(n));

const timeline: EventSettings = {
  ...defaultEventSettings,
  signupStartsAt: day(1),
  previewStartsAt: day(5),
  signupEndsAt: day(10),
  flaggingEndsAt: day(15),
  practicalStartsAt: day(20),
  practicalEndsAt: day(25),
};
const cast: EventSettings = { ...timeline, castingCompletedAt: day(16) };

const selected: CastingResult = {
  result: "SELECTED",
  mutualGreens: [],
  selectedPeers: [],
};
const notSelected: CastingResult = {
  result: "NOT_SELECTED",
  mutualGreens: [],
  selectedPeers: [],
};

function viewer(
  overrides: Partial<ViewerLike> & {
    status?: UserStatus;
    passwordPending?: boolean;
  } = {},
): ViewerLike {
  const {
    status = UserStatus.ENTERED,
    passwordPending = false,
    ...rest
  } = overrides;
  return {
    user: { status, isGm: false, passwordPending },
    settings: timeline,
    vettingCompleted: true,
    castingResult: null,
    hasPracticalResponse: false,
    ...rest,
  };
}

const statuses = [
  UserStatus.INVITED,
  UserStatus.ENTERED,
  UserStatus.WITHDRAWN,
] as const;

describe("hasAccepted", () => {
  it("is false while invited or a password reset is pending", () => {
    expect(hasAccepted(viewer({ status: UserStatus.INVITED }))).toBe(false);
    expect(hasAccepted(viewer({ passwordPending: true }))).toBe(false);
    expect(hasAccepted(viewer())).toBe(true);
    expect(hasAccepted(viewer({ status: UserStatus.WITHDRAWN }))).toBe(true);
  });
});

describe("sign up", () => {
  it.each([
    // [status, day, canSee, canEdit]
    [UserStatus.INVITED, 3, false, false],
    [UserStatus.ENTERED, 0, true, false],
    [UserStatus.ENTERED, 1, true, true],
    [UserStatus.ENTERED, 7, true, true],
    [UserStatus.ENTERED, 10, true, false],
    [UserStatus.WITHDRAWN, 3, true, false],
  ] as const)("%s on day %i", (status, n, canSee, canEdit) => {
    const v = viewer({ status });
    expect(canSeeSignup(v)).toBe(canSee);
    expect(canEditSignup(v, at(n))).toBe(canEdit);
  });

  it("is not editable during a pending password reset", () => {
    expect(canEditSignup(viewer({ passwordPending: true }), at(3))).toBe(false);
  });

  it("is not editable with an empty timeline", () => {
    expect(
      canEditSignup(viewer({ settings: defaultEventSettings }), at(3)),
    ).toBe(false);
  });
});

describe("flaggingMode", () => {
  it.each([
    // [status, completed, day, mode]
    [UserStatus.INVITED, true, 12, "none"],
    [UserStatus.ENTERED, false, 7, "none"],
    [UserStatus.ENTERED, false, 12, "none"],
    [UserStatus.ENTERED, true, 3, "none"],
    [UserStatus.ENTERED, true, 5, "preview"],
    [UserStatus.ENTERED, true, 9, "preview"],
    [UserStatus.ENTERED, true, 10, "flagging"],
    [UserStatus.ENTERED, true, 14, "flagging"],
    [UserStatus.ENTERED, true, 15, "readonly"],
    [UserStatus.WITHDRAWN, true, 3, "none"],
    [UserStatus.WITHDRAWN, false, 12, "none"],
    [UserStatus.WITHDRAWN, true, 7, "names-only"],
    [UserStatus.WITHDRAWN, true, 12, "names-only"],
    [UserStatus.WITHDRAWN, true, 20, "names-only"],
  ] as const)(
    "%s, completed %s, on day %i: %s",
    (status, completed, n, mode) => {
      const v = viewer({ status, vettingCompleted: completed });
      expect(flaggingMode(v, at(n))).toBe(mode);
      expect(canEditFlags(v, at(n))).toBe(mode === "flagging");
    },
  );

  it.each([
    // [castingResult, day, mode]
    [selected, 17, "readonly"],
    [notSelected, 17, "names-only"],
    // Casting completed without a result (e.g. no decision for this invitee).
    [null, 17, "names-only"],
  ] as const)("after casting: %o on day %i is %s", (result, n, mode) => {
    const v = viewer({ settings: cast, castingResult: result });
    expect(flaggingMode(v, at(n))).toBe(mode);
  });

  it("lets selected players flag if the GMs reopen flagging after casting", () => {
    const reopened = { ...cast, flaggingEndsAt: day(30) };
    expect(
      flaggingMode(
        viewer({ settings: reopened, castingResult: selected }),
        at(17),
      ),
    ).toBe("flagging");
    expect(
      flaggingMode(
        viewer({ settings: reopened, castingResult: notSelected }),
        at(17),
      ),
    ).toBe("names-only");
  });

  it("stays in preview when flagging has no start", () => {
    const settings = { ...timeline, signupEndsAt: null };
    expect(flaggingMode(viewer({ settings }), at(12))).toBe("preview");
  });
});

describe("flaggingClosedReason", () => {
  it.each([
    // [status, completed, day, reason]
    [UserStatus.ENTERED, false, 3, "notCompleted"],
    [UserStatus.ENTERED, false, 7, "notCompleted"],
    [UserStatus.ENTERED, false, 12, "signupClosed"],
    [UserStatus.ENTERED, true, 3, "notStarted"],
    [UserStatus.WITHDRAWN, false, 7, "withdrawn"],
    [UserStatus.WITHDRAWN, true, 3, "withdrawn"],
  ] as const)(
    "%s, completed %s, on day %i: %s",
    (status, completed, n, reason) => {
      const v = viewer({ status, vettingCompleted: completed });
      expect(flaggingMode(v, at(n))).toBe("none");
      expect(flaggingClosedReason(v, at(n))).toBe(reason);
    },
  );
});

describe("practicalClosedReason", () => {
  it.each([
    // [status, settings, castingResult, day, reason]
    [UserStatus.ENTERED, timeline, null, 19, "beforeCasting"],
    [UserStatus.ENTERED, timeline, null, 21, "beforeCasting"],
    // A result exists but the casting was reverted: not revealed.
    [UserStatus.ENTERED, timeline, selected, 21, "beforeCasting"],
    [UserStatus.ENTERED, cast, selected, 19, "notStarted"],
    [UserStatus.ENTERED, cast, notSelected, 21, "notSelected"],
    [UserStatus.ENTERED, cast, null, 21, "notSelected"],
    [UserStatus.WITHDRAWN, cast, selected, 21, "withdrawn"],
  ] as const)(
    "%s, casting %#",
    (status, settings, castingResult, n, reason) => {
      const v = viewer({ status, settings, castingResult });
      expect(canSeePractical(v, at(n))).toBe(false);
      expect(practicalClosedReason(v, at(n))).toBe(reason);
    },
  );
});

describe("practical", () => {
  it.each([
    // [status, settings, castingResult, hasResponse, day, canSee, canEdit]
    [UserStatus.ENTERED, timeline, null, false, 21, false, false],
    [UserStatus.ENTERED, cast, selected, false, 19, false, false],
    [UserStatus.ENTERED, cast, selected, false, 20, true, true],
    [UserStatus.ENTERED, cast, selected, true, 25, true, false],
    [UserStatus.ENTERED, cast, notSelected, false, 21, false, false],
    [UserStatus.ENTERED, cast, notSelected, true, 21, false, false],
    // Casting result present but the casting reverted: not revealed.
    [UserStatus.ENTERED, timeline, selected, false, 21, false, false],
    [UserStatus.WITHDRAWN, cast, selected, false, 21, false, false],
    [UserStatus.WITHDRAWN, cast, selected, true, 21, true, false],
    [UserStatus.WITHDRAWN, timeline, null, true, 21, true, false],
    [UserStatus.WITHDRAWN, timeline, null, true, 19, false, false],
    [UserStatus.INVITED, cast, selected, true, 21, false, false],
  ] as const)(
    "%s, casting %#",
    (status, settings, castingResult, hasResponse, n, canSee, canEdit) => {
      const v = viewer({
        status,
        settings,
        castingResult,
        hasPracticalResponse: hasResponse,
      });
      expect(canSeePractical(v, at(n))).toBe(canSee);
      expect(canEditPractical(v, at(n))).toBe(canEdit);
    },
  );
});

describe("privacy and withdrawal", () => {
  it.each(statuses)("%s", (status) => {
    const v = viewer({ status });
    expect(canSeePrivacy(v)).toBe(true);
    expect(canWithdraw(v)).toBe(status === UserStatus.ENTERED);
  });
});

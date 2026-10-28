import { describe, expect, it } from "vitest";

import { getPhase, type PhaseSettings } from "./phase";

const empty: PhaseSettings = {
  signupStartsAt: null,
  previewStartsAt: null,
  signupEndsAt: null,
  flaggingStartsAt: null,
  flaggingEndsAt: null,
  practicalStartsAt: null,
  practicalEndsAt: null,
  castingCompletedAt: null,
};

/** Day n of a fictional month, noon UTC. */
const day = (n: number) => new Date(Date.UTC(2027, 0, n, 12)).toISOString();
const at = (n: number) => new Date(day(n));

const timeline: PhaseSettings = {
  ...empty,
  signupStartsAt: day(1),
  previewStartsAt: day(5),
  signupEndsAt: day(10),
  flaggingEndsAt: day(15),
  practicalStartsAt: day(20),
  practicalEndsAt: day(25),
};

describe("getPhase", () => {
  it("has everything closed with an empty timeline", () => {
    expect(getPhase(empty, at(1))).toEqual({
      signupOpen: false,
      previewOpen: false,
      flaggingStarted: false,
      flaggingOpen: false,
      practicalStarted: false,
      practicalOpen: false,
      castingCompleted: false,
    });
  });

  it.each([
    // [day, signupOpen, previewOpen, flaggingStarted, flaggingOpen, practicalStarted, practicalOpen]
    [0, false, false, false, false, false, false],
    [1, true, false, false, false, false, false],
    [5, true, true, false, false, false, false],
    [9, true, true, false, false, false, false],
    [10, false, true, true, true, false, false],
    [14, false, true, true, true, false, false],
    [15, false, true, true, false, false, false],
    [20, false, true, true, false, true, true],
    [25, false, true, true, false, true, false],
  ])(
    "on day %i",
    (
      n,
      signupOpen,
      previewOpen,
      flaggingStarted,
      flaggingOpen,
      practicalStarted,
      practicalOpen,
    ) => {
      expect(getPhase(timeline, at(n))).toEqual({
        signupOpen,
        previewOpen,
        flaggingStarted,
        flaggingOpen,
        practicalStarted,
        practicalOpen,
        castingCompleted: false,
      });
    },
  );

  it("treats start as inclusive and end as exclusive", () => {
    const start = new Date(day(1));
    const end = new Date(day(10));
    expect(getPhase(timeline, start).signupOpen).toBe(true);
    expect(getPhase(timeline, new Date(start.getTime() - 1)).signupOpen).toBe(
      false,
    );
    expect(getPhase(timeline, new Date(end.getTime() - 1)).signupOpen).toBe(
      true,
    );
    expect(getPhase(timeline, end).signupOpen).toBe(false);
  });

  it("keeps a period without an end open once started", () => {
    const settings = { ...empty, signupStartsAt: day(1) };
    expect(getPhase(settings, at(100)).signupOpen).toBe(true);
    // Flagging defaults to the end of sign-up, which is unset: it never starts.
    expect(getPhase(settings, at(100)).flaggingStarted).toBe(false);
  });

  it("keeps a period without a start closed", () => {
    const settings = { ...empty, signupEndsAt: day(10) };
    expect(getPhase(settings, at(5)).signupOpen).toBe(false);
    expect(
      getPhase({ ...empty, practicalEndsAt: day(10) }, at(5)).practicalOpen,
    ).toBe(false);
  });

  it("needs both sign-up start and preview start for the preview", () => {
    expect(
      getPhase({ ...empty, previewStartsAt: day(1) }, at(5)).previewOpen,
    ).toBe(false);
    expect(
      getPhase({ ...empty, signupStartsAt: day(1) }, at(5)).previewOpen,
    ).toBe(false);
    // A preview start before the sign-up start waits for the sign-up start.
    const early = { ...empty, previewStartsAt: day(1), signupStartsAt: day(3) };
    expect(getPhase(early, at(2)).previewOpen).toBe(false);
    expect(getPhase(early, at(3)).previewOpen).toBe(true);
  });

  it("uses an explicit flagging start over the end of sign-up", () => {
    const settings = { ...timeline, flaggingStartsAt: day(12) };
    expect(getPhase(settings, at(11)).flaggingOpen).toBe(false);
    expect(getPhase(settings, at(11)).flaggingStarted).toBe(false);
    expect(getPhase(settings, at(12)).flaggingOpen).toBe(true);
  });

  it("reopens a period when the GM moves its end", () => {
    const reopened = { ...timeline, signupEndsAt: day(30) };
    expect(getPhase(reopened, at(12)).signupOpen).toBe(true);
  });

  it("reports casting completion independently of the timeline", () => {
    expect(
      getPhase({ ...empty, castingCompletedAt: day(1) }, at(0))
        .castingCompleted,
    ).toBe(true);
  });

  it("ignores unparseable timestamps", () => {
    expect(
      getPhase({ ...empty, signupStartsAt: "not a date" }, at(5)).signupOpen,
    ).toBe(false);
  });
});

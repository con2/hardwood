import { describe, expect, it } from "vitest";

import { localDate, sortFeedback, topicTitle } from "./feedbackEntries";

describe("localDate", () => {
  it("takes the day in the given time zone", () => {
    // 23:30 UTC is already the next day in Helsinki.
    const instant = new Date("2026-11-13T23:30:00Z");
    expect(localDate(instant, "Europe/Helsinki")).toBe("2026-11-14");
    expect(localDate(instant, "UTC")).toBe("2026-11-13");
  });
});

describe("sortFeedback", () => {
  it("puts the newest day first and orders within a day by id", () => {
    const entries = [
      { id: "b", submittedOn: "2026-11-12" },
      { id: "c", submittedOn: "2026-11-13" },
      { id: "a", submittedOn: "2026-11-13" },
    ];
    expect(sortFeedback(entries).map((entry) => entry.id)).toEqual([
      "a",
      "c",
      "b",
    ]);
  });
});

describe("topicTitle", () => {
  const topics = [{ slug: "signup", title: "Sign-up" }];

  it("shows the title of a defined topic", () => {
    expect(topicTitle("signup", topics)).toBe("Sign-up");
  });

  it("falls back to the slug of a topic removed since", () => {
    expect(topicTitle("removed", topics)).toBe("removed");
  });

  it("is null without a topic", () => {
    expect(topicTitle(null, topics)).toBeNull();
  });
});

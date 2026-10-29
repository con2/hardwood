import { describe, expect, it } from "vitest";

import en from "@/translations/en";

import {
  defaultFlagDefinitions,
  flagAbbreviations,
  flagVariant,
  formatFlagDefinitions,
  parseFlagDefinitions,
  withDefaultFlags,
} from "./flagDefinitions";
import { defaultEventSettings } from "./types";

const defaults = defaultFlagDefinitions(en.Flagging.defaultFlags);

describe("defaultFlagDefinitions", () => {
  it("lists the four flags in screen order", () => {
    expect(defaults.map((flag) => flag.slug)).toEqual([
      "red",
      "yellow",
      "neutral",
      "green",
    ]);
    expect(defaults[0]).toEqual({
      slug: "red",
      title: en.Flagging.defaultFlags.red.title,
      definition: en.Flagging.defaultFlags.red.definition,
    });
  });
});

describe("flagVariant", () => {
  it("colours the known slugs and greys the rest", () => {
    expect(flagVariant("red")).toBe("danger");
    expect(flagVariant("yellow")).toBe("warning");
    expect(flagVariant("neutral")).toBe("secondary");
    expect(flagVariant("green")).toBe("success");
    expect(flagVariant("purple")).toBe("secondary");
  });
});

describe("parseFlagDefinitions / formatFlagDefinitions", () => {
  it("round-trips lines with and without a definition", () => {
    const text = "red: Red: Not with them\nneutral: Neutral";
    const parsed = parseFlagDefinitions(text);
    expect(parsed).toEqual([
      { slug: "red", title: "Red", definition: "Not with them" },
      { slug: "neutral", title: "Neutral", definition: "" },
    ]);
    expect(formatFlagDefinitions(parsed)).toBe(text);
  });

  it("keeps colons inside the definition and trims the parts", () => {
    expect(
      parseFlagDefinitions("  green :Green: Note: shared after casting  "),
    ).toEqual([
      {
        slug: "green",
        title: "Green",
        definition: "Note: shared after casting",
      },
    ]);
  });

  it("skips blank lines, accepts CRLF and a bare slug", () => {
    expect(parseFlagDefinitions("\r\npurple\r\n\r\n")).toEqual([
      { slug: "purple", title: "purple", definition: "" },
    ]);
    expect(formatFlagDefinitions(undefined)).toBe("");
  });
});

describe("flagAbbreviations", () => {
  it("uses the shortest unique title prefixes, skipping neutral", () => {
    expect(
      flagAbbreviations([
        { slug: "green", title: "Vihreä", definition: "" },
        { slug: "purple", title: "Violetti", definition: "" },
        { slug: "neutral", title: "Neutraali", definition: "" },
        { slug: "red", title: "Punainen", definition: "" },
      ]),
    ).toEqual({ green: "VIH", purple: "VIO", red: "P" });
  });

  it("falls back to the slug when a title is a prefix of another", () => {
    expect(
      flagAbbreviations([
        { slug: "a", title: "Red", definition: "" },
        { slug: "b", title: "Redder", definition: "" },
      ]),
    ).toEqual({ a: "a", b: "REDD" });
  });
});

describe("withDefaultFlags", () => {
  it("fills in missing or empty flags and keeps configured ones", () => {
    // A row written before flags existed decrypts without the key.
    const withoutFlags = {
      ...defaultEventSettings,
      flags: undefined,
    } as unknown as typeof defaultEventSettings;
    expect(withDefaultFlags(withoutFlags, defaults).flags).toBe(defaults);
    expect(withDefaultFlags(defaultEventSettings, defaults).flags).toBe(
      defaults,
    );
    const custom = [{ slug: "neutral", title: "N", definition: "" }];
    expect(
      withDefaultFlags({ ...defaultEventSettings, flags: custom }, defaults)
        .flags,
    ).toBe(custom);
  });
});

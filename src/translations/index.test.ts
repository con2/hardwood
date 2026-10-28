import { describe, expect, it } from "vitest";

import { eventLocale } from "@/config";

import { getTranslations } from ".";

describe("getTranslations", () => {
  it("returns the requested language", () => {
    expect(getTranslations("en").AppBar.signOut).toBe("Sign Out");
    expect(getTranslations("fi").AppBar.signOut).toBe("Kirjaudu ulos");
  });

  it("defaults to the configured event locale", () => {
    expect(getTranslations()).toBe(getTranslations(eventLocale));
  });
});

// @vitest-environment jsdom
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import en from "@/translations/en";

import { AppBar, type AppBarViewer } from "./AppBar";

let pathname = "/";
vi.mock("next/navigation", () => ({
  usePathname: () => pathname,
  useRouter: () => ({ refresh: vi.fn() }),
}));
vi.mock("@/app/actions/session", () => ({
  signOut: vi.fn(),
  signOutEverywhere: vi.fn(),
}));
vi.mock("@/app/actions/theme", () => ({ setTheme: vi.fn() }));

const gm: AppBarViewer = {
  name: "GM",
  isGm: true,
  hasAccepted: true,
  canSeeFlagging: true,
  canSeePractical: true,
};

function activeLinks(): string[] {
  return screen
    .getAllByRole("link")
    .filter((link) => link.classList.contains("active"))
    .map((link) => link.textContent ?? "");
}

function renderAt(path: string) {
  pathname = path;
  return render(
    <AppBar eventName="Test" viewer={gm} theme="system" messages={en.AppBar} />,
  );
}

describe("AppBar", () => {
  it("highlights the link of the current view", () => {
    renderAt("/flagging");
    expect(activeLinks()).toEqual(["Flagging"]);
  });

  it("highlights the parent link on a sub-view", () => {
    renderAt("/players/flags/0000");
    expect(activeLinks()).toEqual(["Players"]);
  });

  it("highlights nothing on pages outside the bar", () => {
    renderAt("/profile/password");
    expect(activeLinks()).toEqual([]);
  });

  it("offers Sign Out Everywhere after Sign Out", () => {
    renderAt("/signup");
    fireEvent.click(screen.getByRole("button", { name: "GM" }));
    const items = screen
      .getAllByRole("button")
      .map((button) => button.textContent);
    expect(items.slice(items.indexOf("Sign Out"))).toEqual([
      "Sign Out",
      "Sign Out Everywhere",
    ]);
  });

  it("does not follow clicks: the highlight is the route's, not the last click's", () => {
    renderAt("/signup");
    const privacy = screen.getByRole("link", { name: "Privacy" });
    privacy.addEventListener("click", (e) => e.preventDefault()); // jsdom cannot navigate
    fireEvent.click(privacy);
    expect(activeLinks()).toEqual(["Sign Up"]);
  });
});

// @vitest-environment jsdom
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import en from "@/translations/en";

import { PasswordStrengthMeter } from "./PasswordStrengthMeter";

// The real dictionaries are several hundred kB; the meter only needs a score.
vi.mock("@zxcvbn-ts/core", () => ({
  ZxcvbnFactory: class {
    check(password: string) {
      return { score: password.length >= 12 ? 4 : 1 };
    }
  },
}));
vi.mock("@zxcvbn-ts/language-common", () => ({
  dictionary: {},
  adjacencyGraphs: {},
}));
vi.mock("@zxcvbn-ts/language-en", () => ({ dictionary: {}, translations: {} }));
vi.mock("@zxcvbn-ts/language-fi", () => ({ dictionary: {}, translations: {} }));

const messages = en.PasswordStrength;

describe("PasswordStrengthMeter", () => {
  it("shows no label without a password", () => {
    render(
      <PasswordStrengthMeter
        password=""
        locale="en"
        requiredScore={2}
        messages={messages}
      />,
    );
    for (const label of messages.labels) {
      expect(screen.queryByText(label)).toBeNull();
    }
  });

  it("shows the label of the score once a password is typed", async () => {
    const { rerender } = render(
      <PasswordStrengthMeter
        password=""
        locale="fi"
        requiredScore={2}
        messages={messages}
      />,
    );
    rerender(
      <PasswordStrengthMeter
        password="abc"
        locale="fi"
        requiredScore={2}
        messages={messages}
      />,
    );
    expect(
      await screen.findByText(
        `${messages.labels[1]} (${messages.belowRequired})`,
      ),
    ).toBeInTheDocument();

    rerender(
      <PasswordStrengthMeter
        password="correct horse battery staple"
        locale="fi"
        requiredScore={2}
        messages={messages}
      />,
    );
    expect(await screen.findByText(messages.labels[4])).toBeInTheDocument();
    expect(document.querySelector(".progress-bar")).toHaveClass("bg-success");
  });

  it("marks only scores below the required one", async () => {
    render(
      <PasswordStrengthMeter
        password="correct horse battery staple"
        locale="en"
        requiredScore={4}
        messages={messages}
      />,
    );
    expect(await screen.findByText(messages.labels[4])).toBeInTheDocument();
    expect(screen.queryByText(new RegExp(messages.belowRequired))).toBeNull();
  });
});

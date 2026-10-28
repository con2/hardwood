// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import en from "@/translations/en";

import AutosaveSchemaForm, { type AutosaveResult } from "./AutosaveSchemaForm";

function setup(
  impl: () => Promise<AutosaveResult> = async () => ({
    ok: true,
    savedAt: new Date().toISOString(),
  }),
) {
  const action = vi.fn<(formData: FormData) => Promise<AutosaveResult>>(impl);
  render(
    <AutosaveSchemaForm action={action} messages={en.Autosave} locale="en">
      <input name="name" defaultValue="Alice" aria-label="name" />
      <input type="hidden" name="hidden" defaultValue="" data-testid="hidden" />
    </AutosaveSchemaForm>,
  );
  const input = screen.getByLabelText<HTMLInputElement>("name");
  return { action, input };
}

function type(input: HTMLInputElement, value: string) {
  fireEvent.input(input, { target: { value } });
}

describe("AutosaveSchemaForm", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves once after the debounce", async () => {
    const { action, input } = setup();
    type(input, "Al");
    type(input, "Alicia");
    await act(() => vi.advanceTimersByTimeAsync(999));
    expect(action).not.toHaveBeenCalled();
    await act(() => vi.advanceTimersByTimeAsync(1));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0][0].get("name")).toBe("Alicia");
    expect(screen.getByText(/Saved at/)).toBeInTheDocument();
  });

  it("flushes when focus leaves the form", async () => {
    const { action, input } = setup();
    type(input, "Bob");
    await act(async () => {
      fireEvent.focusOut(input, { relatedTarget: document.body });
    });
    expect(action).toHaveBeenCalledTimes(1);
    // Nothing left to save after the debounce.
    await act(() => vi.advanceTimersByTimeAsync(5000));
    expect(action).toHaveBeenCalledTimes(1);
  });

  it("does not save when nothing changed", async () => {
    const { action, input } = setup();
    await act(async () => {
      fireEvent.focusOut(input, { relatedTarget: document.body });
    });
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(action).not.toHaveBeenCalled();
  });

  it("shows an error and retries on the next change", async () => {
    let fail = true;
    const { action, input } = setup(async () =>
      fail ? { ok: false } : { ok: true, savedAt: new Date().toISOString() },
    );
    type(input, "Carol");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(screen.getByRole("alert")).toHaveTextContent(/Saving failed/);
    // No retry loop by polling alone.
    await act(() => vi.advanceTimersByTimeAsync(10_000));
    expect(action).toHaveBeenCalledTimes(1);

    fail = false;
    type(input, "Caroline");
    await act(() => vi.advanceTimersByTimeAsync(1000));
    expect(action).toHaveBeenCalledTimes(2);
    expect(screen.getByText(/Saved at/)).toBeInTheDocument();
  });

  it("catches changes that fire no event by polling", async () => {
    const { action } = setup();
    // As the MarkdownEditor's hidden input after a toolbar command.
    screen.getByTestId<HTMLInputElement>("hidden").value = "**bold**";
    await act(() => vi.advanceTimersByTimeAsync(3000 + 1000));
    expect(action).toHaveBeenCalledTimes(1);
    expect(action.mock.calls[0][0].get("hidden")).toBe("**bold**");
  });

  it("does not submit natively", async () => {
    const { action, input } = setup();
    type(input, "Dave");
    const form = input.form!;
    const event = new Event("submit", { bubbles: true, cancelable: true });
    await act(async () => {
      form.dispatchEvent(event);
    });
    expect(event.defaultPrevented).toBe(true);
    expect(action).toHaveBeenCalledTimes(1);
  });
});

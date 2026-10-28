"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

import type { Translations } from "@/translations";

export type AutosaveResult =
  { ok: true; savedAt: string } | { ok: false; reason?: "forbidden" };

type Status =
  | { state: "idle" }
  | { state: "saving" }
  | { state: "saved"; savedAt: string }
  | { state: "error"; reason?: "forbidden" };

interface Props<R extends AutosaveResult> {
  /** A server action that saves the form. */
  action(formData: FormData): Promise<R>;
  /** Called after every save attempt that reached the server. */
  onSaved?(result: R): void;
  messages: Translations["Autosave"];
  /** For the time of the last save. */
  locale?: string;
  debounceMs?: number;
  /**
   * How often the serialised form is compared against the last attempted save, to catch changes
   * that fire no `input` event on the form (the MarkdownEditor toolbar).
   */
  pollMs?: number;
  className?: string;
  children: ReactNode;
}

/** A stable representation of the form's string entries, to tell whether anything changed. */
function serialize(form: HTMLFormElement): string {
  const entries: [string, string][] = [];
  for (const [key, value] of new FormData(form).entries()) {
    if (typeof value === "string") entries.push([key, value]);
  }
  return JSON.stringify(entries);
}

/**
 * Wraps the uncontrolled inputs of a `SchemaForm` in a `<form>` and saves it automatically: on
 * `input`/`change` after `debounceMs` of quiet, immediately when focus leaves the form or the
 * page is hidden or unloaded, and when polling finds a change no event announced. Inputs stay
 * enabled while saving; a failed save is retried on the next change (or flush).
 *
 * MarkdownEditor keeps its value in React state and mirrors it into a hidden input on render, so
 * the `input` event of its textarea fires before the hidden input is updated. The debounce runs
 * after that render, and toolbar commands, which may fire no event at all, are caught by polling.
 */
export default function AutosaveSchemaForm<R extends AutosaveResult>({
  action,
  onSaved,
  messages,
  locale,
  debounceMs = 1000,
  pollMs = 3000,
  className,
  children,
}: Props<R>) {
  const formRef = useRef<HTMLFormElement>(null);
  const [status, setStatus] = useState<Status>({ state: "idle" });

  // Mutable save state, only touched in event handlers and effects.
  const state = useRef({
    /** Serialisation of the last successful save (or of the initial form). */
    saved: "",
    /** Serialisation of the last save attempt, successful or not. */
    attempted: "",
    timer: null as ReturnType<typeof setTimeout> | null,
    saving: false,
    /** A save was requested while another was in flight. */
    pending: false,
  });

  // Callbacks change identity on every render; the listeners below read the latest ones.
  const latest = useRef({ action, onSaved });
  useEffect(() => {
    latest.current = { action, onSaved };
  });

  useEffect(() => {
    const form = formRef.current;
    if (!form) return;
    const s = state.current;
    s.saved = s.attempted = serialize(form);

    const save = async () => {
      if (s.timer) {
        clearTimeout(s.timer);
        s.timer = null;
      }
      if (s.saving) {
        s.pending = true;
        return;
      }
      const snapshot = serialize(form);
      if (snapshot === s.saved) return;

      s.saving = true;
      s.attempted = snapshot;
      setStatus({ state: "saving" });
      try {
        const result = await latest.current.action(new FormData(form));
        if (result.ok) {
          s.saved = snapshot;
          setStatus({ state: "saved", savedAt: result.savedAt });
        } else {
          setStatus({ state: "error", reason: result.reason });
        }
        latest.current.onSaved?.(result);
      } catch {
        setStatus({ state: "error" });
      } finally {
        s.saving = false;
      }
      if (s.pending) {
        s.pending = false;
        void save();
      }
    };

    const schedule = () => {
      if (s.timer) clearTimeout(s.timer);
      s.timer = setTimeout(() => void save(), debounceMs);
    };

    const flush = () => {
      if (s.timer || serialize(form) !== s.saved) void save();
    };

    const onFocusOut = (event: FocusEvent) => {
      const next = event.relatedTarget;
      if (next instanceof Node && form.contains(next)) return;
      flush();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") flush();
    };

    // Enter in a text input would submit the form natively.
    const onSubmit = (event: SubmitEvent) => {
      event.preventDefault();
      flush();
    };

    const poll = setInterval(() => {
      if (s.timer || s.saving) return;
      if (serialize(form) !== s.attempted) schedule();
    }, pollMs);

    form.addEventListener("input", schedule);
    form.addEventListener("change", schedule);
    form.addEventListener("focusout", onFocusOut);
    form.addEventListener("submit", onSubmit);
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);

    return () => {
      clearInterval(poll);
      if (s.timer) clearTimeout(s.timer);
      form.removeEventListener("input", schedule);
      form.removeEventListener("change", schedule);
      form.removeEventListener("focusout", onFocusOut);
      form.removeEventListener("submit", onSubmit);
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
    };
  }, [debounceMs, pollMs]);

  return (
    <form ref={formRef} className={className} noValidate>
      <div
        className="AutosaveSchemaForm-status sticky-top bg-body small py-2 mb-2"
        aria-live="polite"
      >
        <AutosaveStatus status={status} messages={messages} locale={locale} />
      </div>
      {children}
    </form>
  );
}

function AutosaveStatus({
  status,
  messages,
  locale,
}: {
  status: Status;
  messages: Translations["Autosave"];
  locale?: string;
}) {
  switch (status.state) {
    case "idle":
      return <span className="text-muted">{messages.idle}</span>;
    case "saving":
      return (
        <span className="text-muted">
          <span
            className="spinner-border spinner-border-sm me-2"
            aria-hidden="true"
          />
          {messages.saving}
        </span>
      );
    case "saved": {
      const time = new Date(status.savedAt).toLocaleTimeString(locale, {
        hour: "2-digit",
        minute: "2-digit",
      });
      return (
        <span className="text-success">
          {messages.saved} {time}
        </span>
      );
    }
    case "error":
      return (
        <span className="text-danger" role="alert">
          {status.reason === "forbidden" ? messages.forbidden : messages.error}
        </span>
      );
  }
}

"use client";

/**
 * Editable cells of the Players table. Each saves on its own through a server action
 * (autosave) and shows a brief saved / error state next to the control.
 */
import { CopyButton } from "@con2/components";
import { useEffect, useRef, useState, useTransition } from "react";
import Button from "react-bootstrap/Button";
import Dropdown from "react-bootstrap/Dropdown";
import Modal from "react-bootstrap/Modal";

import type { Choice, PlayerAttributes } from "@/models/types";
import type { UiStatus } from "@/models/playerStatus";
import type { Translations } from "@/translations";

import {
  deletePlayerAction,
  type PlayerActionResult,
  resetPasswordAction,
  type ResetPasswordResult,
  setStatusAction,
  updateAttributesAction,
} from "./actions";

type Messages = Translations["Players"]["cells"];
type ErrorMessages = Translations["Players"]["errors"];

interface CellMessages {
  messages: Messages;
  errors: ErrorMessages;
}

type SaveState =
  { state: "idle" } | { state: "saved" } | { state: "error"; message: string };

function useAutosave({ errors }: CellMessages) {
  const [pending, startTransition] = useTransition();
  const [saveState, setSaveState] = useState<SaveState>({ state: "idle" });

  useEffect(() => {
    if (saveState.state !== "saved") return;
    const timeout = setTimeout(() => setSaveState({ state: "idle" }), 2000);
    return () => clearTimeout(timeout);
  }, [saveState]);

  function save(
    fn: () => Promise<PlayerActionResult>,
    onError?: () => void,
  ): void {
    startTransition(async () => {
      let result: PlayerActionResult;
      try {
        result = await fn();
      } catch {
        result = { ok: false, reason: "generic" };
      }
      if (result.ok) {
        setSaveState({ state: "saved" });
      } else {
        setSaveState({ state: "error", message: errors[result.reason] });
        onError?.();
      }
    });
  }

  return { pending, saveState, save };
}

function SaveIndicator({
  pending,
  saveState,
  messages,
}: {
  pending: boolean;
  saveState: SaveState;
  messages: Messages;
}) {
  if (pending) {
    return <div className="small text-muted">{messages.saving}</div>;
  }
  if (saveState.state === "saved") {
    return <div className="small text-success">{messages.saved}</div>;
  }
  if (saveState.state === "error") {
    return (
      <div className="small text-danger" role="alert">
        {saveState.message}
      </div>
    );
  }
  return null;
}

export function StatusCell({
  userId,
  value,
  options,
  ...cellMessages
}: CellMessages & {
  userId: string;
  value: UiStatus;
  options: { value: UiStatus; label: string }[];
}) {
  const { pending, saveState, save } = useAutosave(cellMessages);
  const [current, setCurrent] = useState(value);

  return (
    <div>
      <select
        className="form-select form-select-sm w-auto"
        value={current}
        disabled={pending}
        aria-label={cellMessages.messages.status}
        onChange={(event) => {
          const next = event.target.value as UiStatus;
          setCurrent(next);
          save(
            () => setStatusAction(userId, next),
            () => setCurrent(value),
          );
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      <SaveIndicator
        pending={pending}
        saveState={saveState}
        messages={cellMessages.messages}
      />
    </div>
  );
}

export function CharacterNameCell({
  userId,
  value,
  ...cellMessages
}: CellMessages & { userId: string; value: string }) {
  const { pending, saveState, save } = useAutosave(cellMessages);
  const saved = useRef(value);

  function commit(next: string) {
    if (next.trim() === saved.current) return;
    const previous = saved.current;
    saved.current = next.trim();
    save(
      () => updateAttributesAction(userId, { characterName: next }),
      () => {
        saved.current = previous;
      },
    );
  }

  return (
    <div style={{ minWidth: "10rem" }}>
      <input
        type="text"
        className="form-control form-control-sm"
        defaultValue={value}
        maxLength={200}
        aria-label={cellMessages.messages.characterName}
        onBlur={(event) => commit(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === "Enter") {
            event.preventDefault();
            commit(event.currentTarget.value);
          }
        }}
      />
      <SaveIndicator
        pending={pending}
        saveState={saveState}
        messages={cellMessages.messages}
      />
    </div>
  );
}

export function ChoiceCell({
  userId,
  field,
  value,
  choices,
  label,
  ...cellMessages
}: CellMessages & {
  userId: string;
  field: keyof Pick<PlayerAttributes, "characterGroup" | "feeCategory">;
  value: string | null;
  choices: Choice[];
  label: string;
}) {
  const { pending, saveState, save } = useAutosave(cellMessages);
  const [current, setCurrent] = useState(value ?? "");
  // A slug no longer among the choices is still shown, so that saving another cell keeps it.
  const unknown = current && !choices.some((c) => c.slug === current);

  return (
    <div>
      <select
        className="form-select form-select-sm w-auto"
        value={current}
        disabled={pending}
        aria-label={label}
        onChange={(event) => {
          const next = event.target.value;
          setCurrent(next);
          save(
            () => updateAttributesAction(userId, { [field]: next || null }),
            () => setCurrent(value ?? ""),
          );
        }}
      >
        <option value="">{cellMessages.messages.noChoice}</option>
        {unknown ? <option value={current}>{current}</option> : null}
        {choices.map((choice) => (
          <option key={choice.slug} value={choice.slug}>
            {choice.title}
          </option>
        ))}
      </select>
      <SaveIndicator
        pending={pending}
        saveState={saveState}
        messages={cellMessages.messages}
      />
    </div>
  );
}

export function FeePaidCell({
  userId,
  value,
  ...cellMessages
}: CellMessages & { userId: string; value: boolean }) {
  const { pending, saveState, save } = useAutosave(cellMessages);
  const [current, setCurrent] = useState(value);

  return (
    <div>
      <input
        type="checkbox"
        className="form-check-input"
        checked={current}
        disabled={pending}
        aria-label={cellMessages.messages.feePaid}
        onChange={(event) => {
          const next = event.target.checked;
          setCurrent(next);
          save(
            () => updateAttributesAction(userId, { feePaid: next }),
            () => setCurrent(value),
          );
        }}
      />
      <SaveIndicator
        pending={pending}
        saveState={saveState}
        messages={cellMessages.messages}
      />
    </div>
  );
}

type PlayersMessages = Translations["Players"];

/**
 * The row's actions behind a "…" menu: copying the invitation link, resetting the password
 * (`canResetPassword`) and deleting (`canDelete`). The modals live outside the menu, which closes
 * as soon as an item is chosen.
 */
export function RowActions({
  userId,
  invitationUrl,
  canResetPassword,
  canDelete,
  messages,
}: {
  userId: string;
  invitationUrl: string;
  canResetPassword: boolean;
  canDelete: boolean;
  messages: Pick<
    PlayersMessages,
    "columns" | "copyInviteLink" | "resetPassword" | "delete" | "errors"
  >;
}) {
  const [modal, setModal] = useState<"resetPassword" | "delete" | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!copied) return;
    const timeout = setTimeout(() => setCopied(false), 2000);
    return () => clearTimeout(timeout);
  }, [copied]);

  const close = () => setModal(null);

  return (
    <>
      <span className="position-relative d-inline-block">
        <Dropdown align="end" className="RowActions d-inline-block">
          <Dropdown.Toggle
            variant="outline-secondary"
            size="sm"
            aria-label={messages.columns.actions}
          >
            …
          </Dropdown.Toggle>
          <Dropdown.Menu popperConfig={{ strategy: "fixed" }}>
            <Dropdown.Item
              as="button"
              onClick={() => {
                void navigator.clipboard.writeText(invitationUrl);
                setCopied(true);
              }}
            >
              {messages.copyInviteLink.title}
            </Dropdown.Item>
            {canResetPassword ? (
              <Dropdown.Item
                as="button"
                onClick={() => setModal("resetPassword")}
              >
                {messages.resetPassword.title}…
              </Dropdown.Item>
            ) : null}
            {canDelete ? (
              <Dropdown.Item
                as="button"
                className="text-danger"
                onClick={() => setModal("delete")}
              >
                {messages.delete.title}…
              </Dropdown.Item>
            ) : null}
          </Dropdown.Menu>
        </Dropdown>
        <span
          className="position-absolute top-50 end-100 translate-middle-y me-2 badge bg-success"
          role="status"
          aria-live="polite"
          style={{
            opacity: copied ? 1 : 0,
            transition: "opacity 0.3s ease",
            pointerEvents: "none",
            whiteSpace: "nowrap",
          }}
        >
          {messages.copyInviteLink.success}
        </span>
      </span>
      {canResetPassword ? (
        <ResetPasswordModal
          userId={userId}
          show={modal === "resetPassword"}
          onHide={close}
          messages={messages.resetPassword}
          errors={messages.errors}
        />
      ) : null}
      {canDelete ? (
        <DeleteModal
          userId={userId}
          show={modal === "delete"}
          onHide={close}
          messages={messages.delete}
        />
      ) : null}
    </>
  );
}

function DeleteModal({
  userId,
  show,
  onHide,
  messages,
}: {
  userId: string;
  show: boolean;
  onHide: () => void;
  messages: PlayersMessages["delete"];
}) {
  const [pending, startTransition] = useTransition();

  function remove() {
    const formData = new FormData();
    formData.set("userId", userId);
    startTransition(async () => {
      await deletePlayerAction(formData);
      onHide();
    });
  }

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{messages.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <p className="mb-0">{messages.confirm}</p>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          {messages.cancel}
        </Button>
        <Button variant="danger" onClick={remove} disabled={pending}>
          {messages.submit}
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

/**
 * Confirms, resets the password and shows the new initial password once. Closing the modal
 * forgets it.
 */
function ResetPasswordModal({
  userId,
  show,
  onHide,
  messages,
  errors,
}: {
  userId: string;
  show: boolean;
  onHide: () => void;
  messages: PlayersMessages["resetPassword"];
  errors: ErrorMessages;
}) {
  const [result, setResult] = useState<ResetPasswordResult | null>(null);
  const [pending, startTransition] = useTransition();

  function close() {
    onHide();
    setResult(null);
  }

  function reset() {
    startTransition(async () => {
      try {
        setResult(await resetPasswordAction(userId));
      } catch {
        setResult({ ok: false, reason: "generic" });
      }
    });
  }

  return (
    <Modal show={show} onHide={close} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>{messages.title}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {result?.ok ? (
          <>
            <div className="alert alert-warning">{messages.done}</div>
            <dl>
              <dt>{messages.link}</dt>
              <dd className="d-flex gap-2 align-items-center flex-wrap">
                <code className="text-break">{result.url}</code>
                <CopyButton
                  data={result.url}
                  className="btn btn-sm btn-outline-primary"
                  messages={messages.copyLink}
                />
              </dd>
              <dt>{messages.initialPassword}</dt>
              <dd className="d-flex gap-2 align-items-center flex-wrap">
                <code>{result.initialPassword}</code>
                <CopyButton
                  data={result.initialPassword}
                  className="btn btn-sm btn-outline-primary"
                  messages={messages.copyPassword}
                />
              </dd>
            </dl>
          </>
        ) : (
          <>
            <p>{messages.confirm}</p>
            {result && !result.ok ? (
              <div className="alert alert-danger" role="alert">
                {messages.failed} {errors[result.reason]}
              </div>
            ) : null}
          </>
        )}
      </Modal.Body>
      <Modal.Footer>
        {result?.ok ? (
          <Button variant="primary" onClick={close}>
            {messages.close}
          </Button>
        ) : (
          <>
            <Button variant="outline-secondary" onClick={close}>
              {messages.cancel}
            </Button>
            <Button variant="danger" onClick={reset} disabled={pending}>
              {messages.submit}
            </Button>
          </>
        )}
      </Modal.Footer>
    </Modal>
  );
}

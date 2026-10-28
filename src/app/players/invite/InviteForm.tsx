"use client";

import { CopyButton, SubmitButton } from "@con2/components";
import { useActionState } from "react";

import type { Translations } from "@/translations";

import { createInvitesAction, type CreateInvitesState } from "../actions";

interface Props {
  messages: Translations["Players"]["invite"];
}

/**
 * The invites, with their initial passwords, live only in this component's state: they are
 * rendered from the action's return value and stored nowhere else.
 */
export function InviteForm({ messages }: Props) {
  const [state, action] = useActionState<CreateInvitesState, FormData>(
    createInvitesAction,
    { status: "idle" },
  );

  if (state.status === "created") {
    return (
      <>
        <h2 className="h4">{messages.created}</h2>
        <div className="alert alert-warning" role="status">
          {messages.passwordsOnce}
        </div>
        <div className="table-responsive">
          <table className="table table-striped">
            <thead>
              <tr>
                <th scope="col">{messages.columns.discordHandle}</th>
                <th scope="col">{messages.columns.link}</th>
                <th scope="col">{messages.columns.initialPassword}</th>
              </tr>
            </thead>
            <tbody>
              {state.invites.map((invite) => (
                <tr key={invite.url}>
                  <th scope="row" className="align-middle">
                    {invite.discordHandle}
                  </th>
                  <td className="align-middle">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <code className="text-break">{invite.url}</code>
                      <CopyButton
                        data={invite.url}
                        className="btn btn-sm btn-outline-primary"
                        messages={messages.copyLink}
                      />
                    </div>
                  </td>
                  <td className="align-middle">
                    <div className="d-flex gap-2 align-items-center flex-wrap">
                      <code>{invite.initialPassword}</code>
                      <CopyButton
                        data={invite.initialPassword}
                        className="btn btn-sm btn-outline-primary"
                        messages={messages.copyPassword}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  }

  return (
    // A failed submit returns the text; the key re-mounts the textarea with it.
    <form
      action={action}
      style={{ maxWidth: "40rem" }}
      key={state.status === "error" ? state.text : ""}
    >
      {state.status === "error" ? (
        <div className="alert alert-danger" role="alert">
          {messages[state.reason]}
        </div>
      ) : null}
      <div className="mb-3">
        <label htmlFor="Invite-handles" className="form-label fw-bold">
          {messages.handles}
        </label>
        <textarea
          id="Invite-handles"
          name="handles"
          className="form-control font-monospace"
          rows={12}
          required
          defaultValue={state.status === "error" ? state.text : ""}
        />
        <div className="form-text">{messages.helpText}</div>
      </div>
      <SubmitButton>{messages.submit}</SubmitButton>
    </form>
  );
}

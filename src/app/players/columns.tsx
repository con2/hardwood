import { type Column, CopyButton, ModalButton } from "@con2/components";

import type { PlayerRow, ResponseState } from "@/models/players";
import { allowedUiStatuses } from "@/models/playerStatus";
import type { EventSettings } from "@/models/types";
import type { Translations } from "@/translations";

import { deletePlayerAction } from "./actions";
import {
  CharacterNameCell,
  ChoiceCell,
  FeePaidCell,
  ResetPasswordButton,
  StatusCell,
} from "./cells";

/** Bootstrap contextual table classes: the cell background carries the state. */
const responseStateClass: Record<ResponseState, string> = {
  none: "table-secondary",
  inProgress: "table-warning",
  completed: "table-success",
};

function responseColumn(
  slug: "vetting" | "flagging" | "practical",
  title: string,
  messages: Translations["Players"]["responseState"],
): Column<PlayerRow> {
  return {
    slug,
    title,
    getCellElement: (row, children) => (
      <td className={responseStateClass[row[slug]]}>{children}</td>
    ),
    getCellContents: (row) => messages[row[slug]],
  };
}

interface Context {
  t: Translations;
  settings: Pick<EventSettings, "characterGroups" | "feeCategories">;
  /** The signed-in GM, who cannot reset their own password here. */
  viewerId: string;
}

/**
 * The columns of the Players table. Their order here is the order on screen; nothing else
 * depends on it.
 */
export function playerColumns({
  t,
  settings,
  viewerId,
}: Context): Column<PlayerRow>[] {
  const m = t.Players;
  const cellMessages = { messages: m.cells, errors: m.errors };

  return [
    {
      slug: "status",
      title: m.columns.status,
      getCellContents: (row) => (
        <StatusCell
          // Re-mount when the server state changes, e.g. after `refresh()`.
          key={row.uiStatus}
          userId={row.id}
          value={row.uiStatus}
          options={allowedUiStatuses(row.uiStatus).map((value) => ({
            value,
            label: t.UserStatus[value],
          }))}
          {...cellMessages}
        />
      ),
    },
    {
      slug: "isGm",
      title: m.columns.isGm,
      getCellElement: (row, children) => (
        <td className={row.isGm ? "table-primary" : undefined}>{children}</td>
      ),
      getCellContents: (row) => (row.isGm ? m.gm : null),
    },
    {
      slug: "name",
      title: m.columns.name,
      scope: "row",
      getCellContents: (row) =>
        row.name ?? <span className="text-muted">{m.noName}</span>,
    },
    {
      slug: "discordHandle",
      title: m.columns.discordHandle,
      getCellContents: (row) => row.discordHandle ?? "",
    },
    {
      slug: "characterName",
      title: m.columns.characterName,
      getCellContents: (row) => (
        <CharacterNameCell
          key={row.attributes.characterName}
          userId={row.id}
          value={row.attributes.characterName}
          {...cellMessages}
        />
      ),
    },
    {
      slug: "characterGroup",
      title: m.columns.characterGroup,
      getCellContents: (row) => (
        <ChoiceCell
          key={row.attributes.characterGroup ?? ""}
          userId={row.id}
          field="characterGroup"
          value={row.attributes.characterGroup}
          choices={settings.characterGroups}
          label={m.columns.characterGroup}
          {...cellMessages}
        />
      ),
    },
    {
      slug: "feeCategory",
      title: m.columns.feeCategory,
      getCellContents: (row) => (
        <ChoiceCell
          key={row.attributes.feeCategory ?? ""}
          userId={row.id}
          field="feeCategory"
          value={row.attributes.feeCategory}
          choices={settings.feeCategories}
          label={m.columns.feeCategory}
          {...cellMessages}
        />
      ),
    },
    {
      slug: "feePaid",
      title: m.columns.feePaid,
      getCellContents: (row) => (
        <FeePaidCell
          key={String(row.attributes.feePaid)}
          userId={row.id}
          value={row.attributes.feePaid}
          {...cellMessages}
        />
      ),
    },
    responseColumn("vetting", m.columns.vetting, m.responseState),
    responseColumn("flagging", m.columns.flagging, m.responseState),
    responseColumn("practical", m.columns.practical, m.responseState),
    {
      slug: "actions",
      title: m.columns.actions,
      getCellContents: (row) => (
        <div className="d-flex gap-2 flex-wrap">
          <CopyButton
            data={row.invitationUrl}
            className="btn btn-sm btn-outline-primary"
            messages={m.copyInviteLink}
          />
          {row.id !== viewerId ? (
            <ResetPasswordButton
              userId={row.id}
              messages={m.resetPassword}
              errors={m.errors}
            />
          ) : null}
          {row.uiStatus === "WITHDRAWN" ? (
            <ModalButton
              title={m.delete.title}
              className="btn btn-sm btn-outline-danger"
              action={deletePlayerAction}
              messages={m.delete}
              submitButtonVariant="danger"
            >
              <input type="hidden" name="userId" value={row.id} />
              <p className="mb-0">{m.delete.confirm}</p>
            </ModalButton>
          ) : null}
        </div>
      ),
    },
  ];
}

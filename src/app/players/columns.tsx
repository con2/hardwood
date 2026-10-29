import type { Column } from "@con2/components";

import type { PlayerRow, ResponseState } from "@/models/players";
import { allowedUiStatuses } from "@/models/playerStatus";
import type { EventSettings } from "@/models/types";
import type { Translations } from "@/translations";

import {
  CharacterNameCell,
  ChoiceCell,
  FeePaidCell,
  RowActions,
  StatusCell,
} from "./cells";

/**
 * The cell background carries the state. `text-bg-*` rather than `table-*` for stronger colours,
 * at the cost of the striping. A custom cell element replaces DataTable's default `align-middle`,
 * so these cells set it themselves.
 */
const responseStateClass: Record<ResponseState, string> = {
  none: "text-bg-secondary align-middle",
  inProgress: "text-bg-warning align-middle",
  completed: "text-bg-success align-middle",
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
        <td
          className={row.isGm ? "text-bg-primary align-middle" : "align-middle"}
        >
          {children}
        </td>
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
      // FeePaidCell renders the <td>: its background follows the checkbox, not the server state.
      getCellElement: (_row, children) => children,
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
        <RowActions
          userId={row.id}
          invitationUrl={row.invitationUrl}
          canResetPassword={row.id !== viewerId}
          canDelete={row.uiStatus === "WITHDRAWN"}
          messages={{
            columns: m.columns,
            copyInviteLink: m.copyInviteLink,
            resetPassword: m.resetPassword,
            delete: m.delete,
            errors: m.errors,
          }}
        />
      ),
    },
  ];
}

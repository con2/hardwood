import {
  type Column,
  CopyButton,
  DataTable,
  formatDateTime,
} from "@con2/components";

import { requireGm } from "@/auth/viewer";
import { eventLocale, eventTimezone } from "@/config";
import { invitationUrl, listUsers, readInvitationToken } from "@/models/user";
import { getTranslations } from "@/translations";

/** The six statuses the Players view shows; SELECTED / NOT_SELECTED come from GM-only attributes (M4). */
type DisplayStatus =
  "INVITED" | "REVOKED" | "ENTERED" | "SELECTED" | "NOT_SELECTED" | "WITHDRAWN";

interface Row {
  id: string;
  status: DisplayStatus;
  isGm: boolean;
  createdAt: Date;
  invitationUrl: string;
}

/** Skeleton: lists invitees with plaintext columns only. Decrypted columns come in M4. */
export default async function PlayersPage() {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Players;

  const rows: Row[] = (await listUsers()).map((user) => ({
    id: user.id,
    // TODO(M4): combine with PLAYER_ATTRIBUTES.castingDecision.
    status: user.status,
    isGm: user.isGm,
    createdAt: user.createdAt,
    invitationUrl: invitationUrl(readInvitationToken(user, viewer.keys)),
  }));

  // The order of this array is the order of the columns; nothing else depends on it.
  const columns: Column<Row>[] = [
    {
      slug: "status",
      title: m.columns.status,
      getCellContents: (row) => t.UserStatus[row.status],
    },
    {
      slug: "isGm",
      title: m.columns.isGm,
      getCellContents: (row) =>
        row.isGm ? <span className="badge text-bg-primary">{m.gm}</span> : null,
    },
    {
      slug: "createdAt",
      title: m.columns.createdAt,
      getCellContents: (row) =>
        formatDateTime(row.createdAt, eventLocale, eventTimezone),
    },
    {
      slug: "actions",
      title: m.columns.actions,
      getCellContents: (row) => (
        <CopyButton
          data={row.invitationUrl}
          className="btn btn-sm btn-outline-primary"
          messages={m.copyInviteLink}
        />
      ),
    },
  ];

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{m.title}</h1>
      <DataTable
        rows={rows}
        columns={columns}
        getTotalMessage={m.total}
        responsive
      />
    </div>
  );
}

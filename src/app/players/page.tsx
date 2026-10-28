import {
  AutoSubmitForm,
  DataTable,
  formatDateTime,
  ModalButton,
} from "@con2/components";
import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { eventLocale, eventTimezone } from "@/config";
import { listPlayers, type PlayerErrorReason } from "@/models/players";
import { isUiStatus, uiStatuses } from "@/models/playerStatus";
import { getTranslations } from "@/translations";

import { completeCastingAction, revertCastingAction } from "./actions";
import { playerColumns } from "./columns";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function single(value: string | string[] | undefined): string {
  return typeof value === "string" ? value : "";
}

/** `group=-` filters for invitees without a character group. */
const noGroup = "-";

export default async function PlayersPage({ searchParams }: Props) {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Players;
  const params = await searchParams;
  const statusFilter = single(params.status);
  const groupFilter = single(params.group);
  const errorParam = single(params.error);
  const error =
    errorParam in m.errors ? m.errors[errorParam as PlayerErrorReason] : null;

  const settings = viewer.settings;
  const rows = (await listPlayers(viewer.keys)).filter(
    (row) =>
      (!isUiStatus(statusFilter) || row.uiStatus === statusFilter) &&
      (!groupFilter ||
        (groupFilter === noGroup
          ? row.attributes.characterGroup === null
          : row.attributes.characterGroup === groupFilter)),
  );
  const castingCompletedAt = settings.castingCompletedAt
    ? new Date(settings.castingCompletedAt)
    : null;

  return (
    <div className="container-fluid mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h1 className="mb-0 me-auto">{m.title}</h1>
        <Link href="/players/invite" className="btn btn-primary">
          {m.links.createInvites}
        </Link>
        <Link href="/players/flags" className="btn btn-outline-primary">
          {m.links.flags}
        </Link>
      </div>

      {error ? (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      ) : null}

      <div className="card mb-3">
        <div className="card-body d-flex flex-wrap gap-3 align-items-center">
          {castingCompletedAt ? (
            <>
              <span className="badge text-bg-success fs-6">
                {m.casting.completedAt}{" "}
                {formatDateTime(castingCompletedAt, eventLocale, eventTimezone)}
              </span>
              <ModalButton
                title={m.casting.revert.title}
                className="btn btn-outline-danger"
                action={revertCastingAction}
                messages={m.casting.revert}
                submitButtonVariant="danger"
              >
                <p className="mb-0">{m.casting.revert.confirm}</p>
              </ModalButton>
            </>
          ) : (
            <>
              <span className="text-muted">{m.casting.notCompleted}</span>
              <ModalButton
                title={m.casting.complete.title}
                className="btn btn-success"
                action={completeCastingAction}
                messages={m.casting.complete}
                submitButtonVariant="success"
              >
                <p className="mb-0">{m.casting.complete.confirm}</p>
              </ModalButton>
            </>
          )}
        </div>
      </div>

      <AutoSubmitForm
        method="get"
        action="/players"
        className="d-flex flex-wrap gap-3 align-items-end mb-3"
      >
        <div>
          <label htmlFor="Players-status" className="form-label">
            {m.filters.status}
          </label>
          <select
            id="Players-status"
            name="status"
            className="form-select"
            defaultValue={isUiStatus(statusFilter) ? statusFilter : ""}
          >
            <option value="">{m.filters.all}</option>
            {uiStatuses.map((status) => (
              <option key={status} value={status}>
                {t.UserStatus[status]}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="Players-group" className="form-label">
            {m.filters.characterGroup}
          </label>
          <select
            id="Players-group"
            name="group"
            className="form-select"
            defaultValue={groupFilter}
          >
            <option value="">{m.filters.all}</option>
            <option value={noGroup}>{m.filters.noGroup}</option>
            {settings.characterGroups.map((group) => (
              <option key={group.slug} value={group.slug}>
                {group.title}
              </option>
            ))}
          </select>
        </div>
        <noscript>
          <button type="submit" className="btn btn-outline-primary">
            {m.filters.submit}
          </button>
        </noscript>
      </AutoSubmitForm>

      <DataTable
        rows={rows}
        columns={playerColumns({ t, settings, viewerId: viewer.user.id })}
        getTotalMessage={m.total}
        responsive
      />
    </div>
  );
}

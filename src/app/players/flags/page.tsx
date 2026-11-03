import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { FlagBadge } from "@/app/flagging/FlaggingList";
import { flagMatrix, type FlagMatrixUser } from "@/models/flags";
import { parseFlagFilter, type FlagFilter } from "@/models/flagSummary";
import { getTranslations } from "@/translations";

import { FlagFilterNav, PersonLink, SensitiveWarning } from "./components";

/** Flagger → target pairs as a list in an alert; nothing when there are none. */
function FlagPairsAlert({
  variant,
  message,
  pairs,
  withdrawnLabel,
  filter,
}: {
  variant: "danger" | "warning";
  message: string;
  pairs: { from: FlagMatrixUser; to: FlagMatrixUser }[];
  withdrawnLabel: string;
  filter: FlagFilter;
}) {
  if (pairs.length === 0) return null;
  return (
    <div className={`alert alert-${variant}`} role="alert">
      <p className="mb-2 fw-bold">{message}</p>
      <ul className="mb-0">
        {pairs.map(({ from, to }) => (
          <li key={`${from.userId}-${to.userId}`}>
            <PersonLink
              user={from}
              withdrawnLabel={withdrawnLabel}
              filter={filter}
            />{" "}
            →{" "}
            <PersonLink
              user={to}
              withdrawnLabel={withdrawnLabel}
              filter={filter}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

/** GM only, linked from Players and not from the app bar: the most sensitive data we hold. */
export default async function FlagsPage({ searchParams }: Props) {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Flags;
  const withdrawnLabel = t.UserStatus.WITHDRAWN;
  const filter = parseFlagFilter((await searchParams).filter);
  const {
    users,
    totals,
    mutualGreens,
    flags,
    selectedRedFlags,
    selectedSafetyOutside,
  } = await flagMatrix(viewer.keys, viewer.settings.flags, filter);

  return (
    <div className="container mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h1 className="mb-0 me-auto">{m.title}</h1>
        <Link href="/players" className="btn btn-outline-secondary">
          {m.backToPlayers}
        </Link>
      </div>
      <SensitiveWarning message={m.warning} />
      <FlagPairsAlert
        variant="danger"
        message={m.selectedRedFlags}
        pairs={selectedRedFlags}
        withdrawnLabel={withdrawnLabel}
        filter={filter}
      />
      <FlagPairsAlert
        variant="warning"
        message={m.selectedSafetyOutside}
        pairs={selectedSafetyOutside}
        withdrawnLabel={withdrawnLabel}
        filter={filter}
      />
      <FlagFilterNav
        path="/players/flags"
        filter={filter}
        messages={m.filters}
      />

      {users.length === 0 ? (
        <p className="text-muted">
          {filter === "all" ? m.empty : m.emptyFiltered}
        </p>
      ) : (
        <>
          <p className="text-muted">
            {m.completedOnly} {m.totals.help}
          </p>
          <div className="table-responsive">
            <table className="table table-sm table-striped w-auto">
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>
                    {m.totals.person}
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={flags.length}
                    className="text-center"
                  >
                    {m.totals.received}
                  </th>
                  <th
                    scope="colgroup"
                    colSpan={flags.length}
                    className="text-center"
                  >
                    {m.totals.given}
                  </th>
                  <th
                    scope="col"
                    rowSpan={2}
                    className="text-center align-bottom"
                  >
                    {m.totals.mutualGreens}
                  </th>
                </tr>
                <tr>
                  {[0, 1].flatMap((group) =>
                    flags.map((flag) => (
                      <th
                        key={`${group}-${flag.slug}`}
                        scope="col"
                        className="text-center"
                      >
                        <FlagBadge flag={flag} />
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const total = totals[user.userId];
                  const mutual = mutualGreens[user.userId].length;
                  return (
                    <tr key={user.userId}>
                      <th scope="row" className="fw-normal text-nowrap">
                        <PersonLink
                          user={user}
                          withdrawnLabel={withdrawnLabel}
                          filter={filter}
                        />
                        {user.completed ? (
                          <span
                            className="ms-1 text-success"
                            title={m.completed}
                            aria-label={m.completed}
                          >
                            ✓
                          </span>
                        ) : null}
                      </th>
                      {[total.received, total.given].flatMap((counts, group) =>
                        flags.map((flag) => (
                          <td
                            key={`${group}-${flag.slug}`}
                            className="text-center"
                          >
                            {counts[flag.slug] || (
                              <span className="text-body-tertiary">0</span>
                            )}
                          </td>
                        )),
                      )}
                      <td className="text-center">
                        {mutual ? (
                          <span className="text-success fw-bold">{mutual}</span>
                        ) : (
                          <span className="text-body-tertiary">0</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

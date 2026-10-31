import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { FlagBadge } from "@/app/flagging/FlaggingList";
import { flagMatrix } from "@/models/flags";
import { getTranslations } from "@/translations";

import { PersonLink, SensitiveWarning } from "./components";

/** GM only, linked from Players and not from the app bar: the most sensitive data we hold. */
export default async function FlagsPage() {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Flags;
  const withdrawnLabel = t.UserStatus.WITHDRAWN;
  const { users, rows, totals, mutualGreens, flags } = await flagMatrix(
    viewer.keys,
    viewer.settings.flags,
  );

  return (
    <div className="container mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h1 className="mb-0 me-auto">{m.title}</h1>
        <Link href="/players" className="btn btn-outline-secondary">
          {m.backToPlayers}
        </Link>
      </div>
      <SensitiveWarning message={m.warning} />

      {users.length === 0 ? (
        <p className="text-muted">{m.empty}</p>
      ) : (
        <>
          {Object.values(rows).some((row) => Object.keys(row).length > 0) ? (
            <p className="text-muted">{m.totals.help}</p>
          ) : (
            <div className="alert alert-info">{m.noFlags}</div>
          )}
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

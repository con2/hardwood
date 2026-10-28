import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { flagColours, flagMatrix } from "@/models/flags";
import { initials } from "@/models/flagSummary";
import { getTranslations } from "@/translations";

import {
  colourVariants,
  ColourBadge,
  PersonLink,
  SensitiveWarning,
} from "./components";

/** GM only, linked from Players and not from the app bar: the most sensitive data we hold. */
export default async function FlagsPage() {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Flags;
  const withdrawnLabel = t.UserStatus.WITHDRAWN;
  const { users, rows, totals } = await flagMatrix(viewer.keys);

  return (
    <div className="container-fluid mt-4 mb-4">
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
          <p className="text-muted">{m.matrixHelp}</p>
          <div className="table-responsive mb-4">
            <table className="table table-sm table-bordered FlagMatrix">
              <thead>
                <tr>
                  <th scope="col" className="FlagMatrix-sticky">
                    {m.flagger}
                  </th>
                  {users.map((target) => (
                    <th
                      key={target.userId}
                      scope="col"
                      className={`text-center ${target.withdrawn ? "text-body-tertiary" : ""}`}
                      title={
                        target.withdrawn
                          ? `${target.name} (${withdrawnLabel})`
                          : target.name
                      }
                    >
                      <Link
                        href={`/players/flags/${target.userId}`}
                        className="link-body-emphasis text-decoration-none"
                      >
                        {initials(target.name)}
                      </Link>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {users.map((flagger) => (
                  <tr
                    key={flagger.userId}
                    className={flagger.withdrawn ? "opacity-75" : undefined}
                  >
                    <th
                      scope="row"
                      className="FlagMatrix-sticky text-nowrap fw-normal"
                    >
                      <PersonLink
                        user={flagger}
                        withdrawnLabel={withdrawnLabel}
                      />
                      {flagger.completed ? (
                        <span
                          className="ms-1 text-success"
                          title={m.completed}
                          aria-label={m.completed}
                        >
                          ✓
                        </span>
                      ) : null}
                    </th>
                    {users.map((target) => {
                      if (target.userId === flagger.userId) {
                        return (
                          <td
                            key={target.userId}
                            className="table-secondary"
                            aria-hidden="true"
                          />
                        );
                      }
                      const colour = rows[flagger.userId]?.[target.userId];
                      return (
                        <td
                          key={target.userId}
                          className={`text-center ${colour ? `table-${colourVariants[colour]}` : ""}`}
                          title={
                            colour
                              ? `${flagger.name} → ${target.name}: ${m.colours[colour]}`
                              : undefined
                          }
                        >
                          {colour ? m.colours[colour].charAt(0) : null}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <h2 className="h4">{m.totals.title}</h2>
          <div className="table-responsive">
            <table className="table table-sm table-striped w-auto">
              <thead>
                <tr>
                  <th scope="col" rowSpan={2}>
                    {m.totals.person}
                  </th>
                  <th scope="colgroup" colSpan={3} className="text-center">
                    {m.totals.received}
                  </th>
                  <th scope="colgroup" colSpan={3} className="text-center">
                    {m.totals.given}
                  </th>
                </tr>
                <tr>
                  {[0, 1].flatMap((group) =>
                    flagColours.map((colour) => (
                      <th
                        key={`${group}-${colour}`}
                        scope="col"
                        className="text-center"
                      >
                        <ColourBadge colour={colour} messages={m} />
                      </th>
                    )),
                  )}
                </tr>
              </thead>
              <tbody>
                {users.map((user) => {
                  const total = totals[user.userId];
                  return (
                    <tr key={user.userId}>
                      <th scope="row" className="fw-normal text-nowrap">
                        <PersonLink
                          user={user}
                          withdrawnLabel={withdrawnLabel}
                        />
                      </th>
                      {[total.received, total.given].flatMap((counts, group) =>
                        flagColours.map((colour) => (
                          <td
                            key={`${group}-${colour}`}
                            className="text-center"
                          >
                            {counts[colour] || (
                              <span className="text-body-tertiary">0</span>
                            )}
                          </td>
                        )),
                      )}
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

import Link from "next/link";
import { notFound } from "next/navigation";

import { FlagBadge } from "@/app/flagging/FlaggingList";
import { requireGm } from "@/auth/viewer";
import { flagsBySlug } from "@/models/flagDefinitions";
import { flagsForPerson, type FlagMatrixUser } from "@/models/flags";
import { parseFlagFilter } from "@/models/flagSummary";
import type { FlagSlug } from "@/models/types";
import { getTranslations } from "@/translations";

import {
  FlagFilterNav,
  PersonLink,
  SensitiveWarning,
  withFilter,
} from "../../flags/components";
import { PlayerView, readUserId } from "../PlayerView";

export default async function PersonFlagsPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireGm();
  const userId = await readUserId(params);
  const filter = parseFlagFilter((await searchParams).filter);
  const data = await flagsForPerson(
    viewer.keys,
    userId,
    viewer.settings.flags,
    filter,
  );
  if (!data) notFound();
  const bySlug = flagsBySlug(viewer.settings.flags);

  const t = getTranslations();
  const m = t.Flags;
  const withdrawnLabel = t.UserStatus.WITHDRAWN;
  const { person, inbound, outbound } = data;
  const mutualGreens = new Set(data.mutualGreens);

  const list = (
    title: string,
    items: {
      user: FlagMatrixUser;
      slug: FlagSlug;
    }[],
    emptyMessage = m.person.none,
  ) => (
    <section className="col-md-6 mb-4">
      <h2 className="h4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-muted">{emptyMessage}</p>
      ) : (
        <ul className="list-group">
          {items.map(({ user, slug }) => {
            const mutual = mutualGreens.has(user.userId);
            return (
              <li
                key={user.userId}
                className={`list-group-item d-flex justify-content-between align-items-center gap-2 ${mutual ? "list-group-item-success" : ""}`}
              >
                <span>
                  <PersonLink
                    user={user}
                    withdrawnLabel={withdrawnLabel}
                    filter={filter}
                  />
                </span>
                <span className="d-flex gap-2">
                  {mutual ? (
                    <span className="badge text-bg-success">
                      {m.person.mutualGreen}
                    </span>
                  ) : null}
                  <FlagBadge
                    flag={
                      bySlug.get(slug) ?? { slug, title: slug, definition: "" }
                    }
                  />
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );

  return (
    <PlayerView
      person={person}
      active="flags"
      filter={filter}
      messages={t.PlayerDetail}
      statusLabels={t.UserStatus}
    >
      <p>
        <Link href={withFilter("/players/flags", filter)}>
          {m.backToSummary}
        </Link>
      </p>
      <SensitiveWarning message={m.warning} />
      <FlagFilterNav
        path={`/players/${person.userId}/flags`}
        filter={filter}
        messages={m.filters}
      />
      <p className="text-muted">{m.completedOnly}</p>
      <div className="row">
        {list(
          m.person.inbound,
          inbound.map(({ from, slug }) => ({ user: from, slug })),
        )}
        {list(
          m.person.outbound,
          outbound.map(({ to, slug }) => ({ user: to, slug })),
          person.completed ? m.person.none : m.person.notCompleted,
        )}
      </div>
    </PlayerView>
  );
}

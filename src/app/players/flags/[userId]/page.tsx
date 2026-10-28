import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { requireGm } from "@/auth/viewer";
import {
  flagsForPerson,
  type FlagColour,
  type FlagMatrixUser,
} from "@/models/flags";
import { getTranslations } from "@/translations";

import { ColourBadge, PersonLink, SensitiveWarning } from "../components";

export default async function PersonFlagsPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const viewer = await requireGm();
  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) notFound();
  const data = await flagsForPerson(viewer.keys, userId);
  if (!data) notFound();

  const t = getTranslations();
  const m = t.Flags;
  const withdrawnLabel = t.UserStatus.WITHDRAWN;
  const { person, inbound, outbound } = data;

  const list = (
    title: string,
    items: {
      user: FlagMatrixUser;
      colour: FlagColour;
    }[],
  ) => (
    <section className="col-md-6 mb-4">
      <h2 className="h4">{title}</h2>
      {items.length === 0 ? (
        <p className="text-muted">{m.person.none}</p>
      ) : (
        <ul className="list-group">
          {items.map(({ user, colour }) => (
            <li
              key={user.userId}
              className="list-group-item d-flex justify-content-between align-items-center gap-2"
            >
              <span>
                <PersonLink user={user} withdrawnLabel={withdrawnLabel} />
              </span>
              <ColourBadge colour={colour} messages={m} />
            </li>
          ))}
        </ul>
      )}
    </section>
  );

  return (
    <div className="container mt-4 mb-4">
      <p>
        <Link href="/players/flags">{m.backToMatrix}</Link>
      </p>
      <h1 className="mb-1">{person.name}</h1>
      <p className="mb-3">
        {person.discordHandle ? (
          <span className="text-muted me-3">{person.discordHandle}</span>
        ) : null}
        {m.person.status}: {t.UserStatus[person.uiStatus]}
      </p>
      <SensitiveWarning message={m.warning} />
      <div className="row">
        {list(
          m.person.inbound,
          inbound.map(({ from, colour }) => ({ user: from, colour })),
        )}
        {list(
          m.person.outbound,
          outbound.map(({ to, colour }) => ({ user: to, colour })),
        )}
      </div>
    </div>
  );
}

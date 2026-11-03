import { ServerTabs, type Tab } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { z } from "zod";

import type { FlagFilter } from "@/models/flagSummary";
import type { PlayerPerson } from "@/models/responses";
import type { Translations } from "@/translations";

import { withFilter } from "../flags/components";

export type PlayerTab = "vetting" | "practical" | "flags";

const playerTabs: PlayerTab[] = ["vetting", "practical", "flags"];

/** The `userId` route param, or a 404 if it is not a uuid. */
export async function readUserId(
  params: Promise<{ userId: string }>,
): Promise<string> {
  const { userId } = await params;
  if (!z.uuid().safeParse(userId).success) notFound();
  return userId;
}

interface Props {
  person: PlayerPerson;
  active: PlayerTab;
  filter: FlagFilter;
  messages: Translations["PlayerDetail"];
  statusLabels: Translations["UserStatus"];
  children: ReactNode;
}

/** Heading and tabs shared by the tabs of the player detail view (GM only). */
export function PlayerView({
  person,
  active,
  filter,
  messages,
  statusLabels,
  children,
}: Props) {
  const tabs: Tab[] = playerTabs.map((slug) => ({
    slug,
    href: withFilter(`/players/${person.userId}/${slug}`, filter),
    title: messages.tabs[slug],
  }));

  return (
    <div className="container mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-1">
        <h1 className="mb-0 me-auto">{person.name}</h1>
        <Link href="/players" className="btn btn-outline-secondary">
          {messages.backToPlayers}
        </Link>
      </div>
      <p className="mb-3">
        {person.discordHandle ? (
          <span className="text-muted me-3">{person.discordHandle}</span>
        ) : null}
        {messages.status}: {statusLabels[person.uiStatus]}
      </p>
      <ServerTabs tabs={tabs} active={active} />
      <div className="pt-3">{children}</div>
    </div>
  );
}

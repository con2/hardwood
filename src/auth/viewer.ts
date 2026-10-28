import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import type { Keys } from "@/crypto/keys";
import { readEventSettings, readRecord } from "@/crypto/records";
import { readSession } from "@/crypto/session";
import { magicSlugs } from "@/components/forms/models";
import { getUser } from "@/models/user";
import type { EventSettings } from "@/models/types";
import { RecordKind, UserStatus } from "@/prisma/enums";
import type { User } from "@/prisma/models";

export interface Viewer {
  user: User;
  keys: Keys;
  /** Decrypted with the session's INVITEE key. */
  settings: EventSettings;
  /** `values.name` from the viewer's own vetting response. */
  name: string | null;
}

/**
 * The signed-in user, or null. Memoised per request: every page, layout and action may call it.
 * A REVOKED user or one deleted since the session was issued counts as signed out.
 */
export const getViewer = cache(async (): Promise<Viewer | null> => {
  const keys = await readSession();
  if (!keys) return null;
  const user = await getUser(keys.userId);
  if (!user || user.status === UserStatus.REVOKED) return null;

  const [settings, vetting] = await Promise.all([
    readEventSettings(keys),
    readRecord(RecordKind.VETTING_RESPONSE, user.id, keys),
  ]);
  const name = vetting?.values[magicSlugs.name];

  return {
    user,
    keys,
    settings,
    name: typeof name === "string" && name.trim() ? name : null,
  };
});

/** Signed-out visitors are sent to the front page (which sends them to larpit.fi). */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return viewer;
}

/** GM-only pages do not reveal themselves to others. */
export async function requireGm(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.user.isGm || !viewer.keys.gmKey) notFound();
  return viewer;
}

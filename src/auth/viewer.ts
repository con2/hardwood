import { notFound, redirect } from "next/navigation";
import { cache } from "react";

import { hasAccepted } from "@/auth/permissions";
import type { Keys } from "@/crypto/keys";
import { readEventSettings, readRecord } from "@/crypto/records";
import { readSession } from "@/crypto/session";
import { magicSlugs } from "@/components/forms/models";
import { getUser } from "@/models/user";
import type {
  CastingResult,
  EventSettings,
  VettingResponse,
} from "@/models/types";
import { db } from "@/prisma/db";
import { RecordKind, UserStatus } from "@/prisma/enums";
import type { User } from "@/prisma/models";

export interface Viewer {
  user: User;
  keys: Keys;
  /** Decrypted with the session's INVITEE key. */
  settings: EventSettings;
  /** `values.name` from the viewer's own vetting response. */
  name: string | null;
  /** The viewer's own vetting response, if any. */
  vettingResponse: VettingResponse | null;
  vettingCompleted: boolean;
  /** The viewer's own casting result; loaded only once the casting is completed. */
  castingResult: CastingResult | null;
  /** Whether a practical survey response of the viewer's exists (not decrypted). */
  hasPracticalResponse: boolean;
}

async function hasRecord(kind: RecordKind, ownerId: string): Promise<boolean> {
  const row = await db.orm.public.EncryptedRecord.select("id").first({
    kind,
    ownerId,
  });
  return !!row;
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

  const [settings, vettingResponse, hasPracticalResponse] = await Promise.all([
    readEventSettings(keys),
    readRecord(RecordKind.VETTING_RESPONSE, user.id, keys),
    hasRecord(RecordKind.PRACTICAL_RESPONSE, user.id),
  ]);
  const castingResult = settings.castingCompletedAt
    ? await readRecord(RecordKind.CASTING_RESULT, user.id, keys)
    : null;
  const name = vettingResponse?.values[magicSlugs.name];

  return {
    user,
    keys,
    settings,
    name: typeof name === "string" && name.trim() ? name : null,
    vettingResponse,
    vettingCompleted: vettingResponse?.completed ?? false,
    castingResult,
    hasPracticalResponse,
  };
});

/** Signed-out visitors are sent to the front page (which sends them to larpit.fi). */
export async function requireViewer(): Promise<Viewer> {
  const viewer = await getViewer();
  if (!viewer) redirect("/");
  return viewer;
}

/** GM-only pages do not reveal themselves to others, nor to GMs who have yet to set a password. */
export async function requireGm(): Promise<Viewer> {
  const viewer = await requireViewer();
  if (!viewer.user.isGm || !viewer.keys.gmKey || !hasAccepted(viewer)) {
    notFound();
  }
  return viewer;
}

/**
 * The Players view (GM only): the decrypted player list, status changes, GM-edited attributes,
 * invites, password resets and deletion. Every function takes the GM's keys explicitly; the
 * callers (server actions) check that the viewer is a GM.
 */
import { z } from "zod";

import { magicSlugs } from "@/components/forms/models";
import { hasIdentity, type AudienceKeys, type Keys } from "@/crypto/keys";
import {
  readAllRecords,
  readEventSettings,
  readRecord,
  writeRecord,
} from "@/crypto/records";
import { parseDates } from "@/prisma/dates";
import { db, type Queryable, type Transaction } from "@/prisma/db";
import { RecordKind, UserStatus } from "@/prisma/enums";

import { recomputeCastingResults } from "./casting";
import { removeFlagsOn } from "./flags";
import {
  applyUiStatus,
  canTransition,
  defaultPlayerAttributes,
  uiStatus,
  type UiStatus,
} from "./playerStatus";
import type { PlayerAttributes } from "./types";
import {
  createInvite,
  getUser,
  invitationUrl,
  readInvitationToken,
  resetPassword,
} from "./user";

/** Why a Players action was refused; shown to the GM through translations. */
export type PlayerErrorReason =
  "notFound" | "invalidTransition" | "notWithdrawn" | "invalid" | "self";

export class PlayerError extends Error {
  constructor(public readonly reason: PlayerErrorReason) {
    super(`Players: ${reason}`);
    this.name = "PlayerError";
  }
}

/** Survey response state for the status badges. */
export type ResponseState = "none" | "inProgress" | "completed";

export interface PlayerRow {
  id: string;
  status: UserStatus;
  uiStatus: UiStatus;
  isGm: boolean;
  passwordPending: boolean;
  createdAt: Date;
  name: string | null;
  discordHandle: string | null;
  attributes: PlayerAttributes;
  vetting: ResponseState;
  flagging: ResponseState;
  practical: ResponseState;
  invitationUrl: string;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function responseState(record: { completed: boolean } | undefined) {
  if (!record) return "none";
  return record.completed ? "completed" : "inProgress";
}

const collator = new Intl.Collator("fi");

/** Display name, falling back to the Discord handle. */
export function playerLabel(row: Pick<PlayerRow, "name" | "discordHandle">) {
  return row.name ?? row.discordHandle ?? "";
}

/** Everyone, decrypted in memory: by display name (Finnish collation), INVITED last. */
export async function listPlayers(keys: AudienceKeys): Promise<PlayerRow[]> {
  const [users, vetting, attributes, flags, practical] = await Promise.all([
    db.orm.public.User.all(),
    readAllRecords(RecordKind.VETTING_RESPONSE, keys),
    readAllRecords(RecordKind.PLAYER_ATTRIBUTES, keys),
    readAllRecords(RecordKind.FLAGS, keys),
    readAllRecords(RecordKind.PRACTICAL_RESPONSE, keys),
  ]);

  const rows = users.map((raw): PlayerRow => {
    const user = parseDates(raw);
    const response = vetting.get(user.id);
    const attrs = {
      ...defaultPlayerAttributes,
      ...attributes.get(user.id),
    };
    return {
      id: user.id,
      status: user.status,
      uiStatus: uiStatus({
        status: user.status,
        castingDecision: attrs.castingDecision,
      }),
      isGm: user.isGm,
      passwordPending: user.passwordPending,
      createdAt: user.createdAt,
      name: stringValue(response?.values[magicSlugs.name]),
      discordHandle: stringValue(response?.values[magicSlugs.discordHandle]),
      attributes: attrs,
      vetting: responseState(response),
      flagging: responseState(flags.get(user.id)),
      practical: responseState(practical.get(user.id)),
      invitationUrl: invitationUrl(readInvitationToken(user, keys)),
    };
  });

  const invitedLast = (row: PlayerRow) =>
    row.status === UserStatus.INVITED ? 1 : 0;
  return rows.sort(
    (a, b) =>
      invitedLast(a) - invitedLast(b) ||
      collator.compare(playerLabel(a), playerLabel(b)),
  );
}

async function readAttributes(
  userId: string,
  keys: AudienceKeys,
  q: Queryable,
): Promise<PlayerAttributes> {
  return {
    ...defaultPlayerAttributes,
    ...(await readRecord(RecordKind.PLAYER_ATTRIBUTES, userId, keys, q)),
  };
}

/**
 * Sets the six-state status, within the spec's transition rules. If the casting has been
 * completed, the derived casting results follow the change at once.
 */
export async function setUiStatus(
  userId: string,
  to: UiStatus,
  keys: AudienceKeys,
): Promise<void> {
  await db.transaction(async (tx: Transaction) => {
    const user = await getUser(userId, tx);
    if (!user) throw new PlayerError("notFound");
    const attributes = await readAttributes(userId, keys, tx);
    const from = uiStatus({
      status: user.status,
      castingDecision: attributes.castingDecision,
    });
    if (!canTransition(from, to)) throw new PlayerError("invalidTransition");
    if (from === to) return;

    const next = applyUiStatus(to, attributes.castingDecision);
    if (next.status !== user.status) {
      await tx.orm.public.User.where({ id: userId }).update({
        status: next.status,
      });
    }
    if (next.castingDecision !== attributes.castingDecision) {
      await writeRecord(
        RecordKind.PLAYER_ATTRIBUTES,
        userId,
        { ...attributes, castingDecision: next.castingDecision },
        ["GM"],
        keys,
        { tx },
      );
    }

    const settings = await readEventSettings(keys, tx);
    if (settings.castingCompletedAt) {
      await recomputeCastingResults(keys, tx);
    }
  });
}

export const playerAttributesPatchSchema = z
  .object({
    characterName: z.string().max(200),
    characterGroup: z.string().max(100).nullable(),
    feeCategory: z.string().max(100).nullable(),
    feePaid: z.boolean(),
  })
  .partial()
  .strict();
export type PlayerAttributesPatch = z.infer<typeof playerAttributesPatchSchema>;

/** Character name, group, fee category and fee paid. Choice slugs must exist in the settings. */
export async function updatePlayerAttributes(
  userId: string,
  patch: PlayerAttributesPatch,
  keys: AudienceKeys,
): Promise<PlayerAttributes> {
  const parsed = playerAttributesPatchSchema.safeParse(patch);
  if (!parsed.success) throw new PlayerError("invalid");
  const input = parsed.data;

  return db.transaction(async (tx: Transaction) => {
    if (!(await getUser(userId, tx))) throw new PlayerError("notFound");
    const settings = await readEventSettings(keys, tx);
    const known = (choices: { slug: string }[], slug: string | null) =>
      slug === null || choices.some((choice) => choice.slug === slug);
    if (
      (input.characterGroup !== undefined &&
        !known(settings.characterGroups, input.characterGroup)) ||
      (input.feeCategory !== undefined &&
        !known(settings.feeCategories, input.feeCategory))
    ) {
      throw new PlayerError("invalid");
    }

    const attributes = {
      ...(await readAttributes(userId, keys, tx)),
      ...input,
    };
    if (input.characterName !== undefined) {
      attributes.characterName = input.characterName.trim();
    }
    await writeRecord(
      RecordKind.PLAYER_ATTRIBUTES,
      userId,
      attributes,
      ["GM"],
      keys,
      { tx },
    );
    return attributes;
  });
}

export interface CreatedInviteRow {
  discordHandle: string;
  userId: string;
  url: string;
  initialPassword: string;
}

/**
 * Invites each Discord handle (already parsed: see `parseDiscordHandles`) in one transaction.
 * The initial passwords are returned for one-time display and stored nowhere.
 */
export async function createInvites(
  discordHandles: string[],
  keys: AudienceKeys,
): Promise<CreatedInviteRow[]> {
  const handles = [
    ...new Set(discordHandles.map((h) => h.trim()).filter(Boolean)),
  ];
  return db.transaction(async (tx: Transaction) => {
    const created: CreatedInviteRow[] = [];
    for (const discordHandle of handles) {
      const invite = await createInvite(
        { discordHandle, isGm: false },
        keys,
        tx,
      );
      created.push({
        discordHandle,
        userId: invite.userId,
        url: invitationUrl(invite.token),
        initialPassword: invite.initialPassword,
      });
    }
    return created;
  });
}

/** GM-led password reset; the link stays the same. For one-time display. */
export async function resetPlayerPassword(
  userId: string,
  keys: AudienceKeys | Keys,
): Promise<{ url: string; initialPassword: string }> {
  const user = await getUser(userId);
  if (!user) throw new PlayerError("notFound");
  if (hasIdentity(keys) && keys.userId === userId) {
    throw new PlayerError("self");
  }
  const { initialPassword } = await resetPassword(userId, keys);
  return {
    url: invitationUrl(readInvitationToken(user, keys)),
    initialPassword,
  };
}

/**
 * Removes every trace of a WITHDRAWN user: their flags in others' blobs, their id in others'
 * mutual greens, then the user row (their own records cascade). One transaction.
 */
export async function deletePlayer(
  userId: string,
  keys: AudienceKeys,
): Promise<void> {
  await db.transaction(async (tx: Transaction) => {
    const user = await getUser(userId, tx);
    if (!user) throw new PlayerError("notFound");
    if (user.status !== UserStatus.WITHDRAWN) {
      throw new PlayerError("notWithdrawn");
    }

    await removeFlagsOn(userId, keys, tx);

    const results = await readAllRecords(RecordKind.CASTING_RESULT, keys, tx);
    for (const [ownerId, result] of results) {
      if (ownerId === userId || !result.mutualGreens.includes(userId)) {
        continue;
      }
      await writeRecord(
        RecordKind.CASTING_RESULT,
        ownerId,
        {
          ...result,
          mutualGreens: result.mutualGreens.filter((id) => id !== userId),
        },
        ["SELF", "GM"],
        keys,
        { tx },
      );
    }

    await tx.orm.public.User.where({ id: userId }).delete();
  });
}

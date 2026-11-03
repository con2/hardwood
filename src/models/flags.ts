/**
 * Flags (docs/spec.md, "Flagging" and "Flags"). Each flagger's flags are one `FLAGS` blob
 * (SELF, GM): the flagger reads and writes it through the SELF wrap, the GMs read all of them
 * through the GM wrap. The flags themselves are defined in the event settings
 * (`src/models/flagDefinitions.ts`); `neutral` is the absence of a key.
 */
import {
  canEditFlags,
  flaggingMode,
  type ViewerLike,
} from "@/auth/permissions";
import { magicSlugs } from "@/components/forms/models";
import type { AudienceKeys, Keys } from "@/crypto/keys";
import { fromBase64Url } from "@/crypto/primitives";
import { readAllRecords, readRecord, writeRecord } from "@/crypto/records";
import { db, type Queryable, type Transaction } from "@/prisma/db";
import { RecordKind, UserStatus } from "@/prisma/enums";
import type { User } from "@/prisma/models";

import {
  isConfiguredFlag,
  neutralFlagSlug,
  nonNeutralFlags,
  redFlagSlug,
  safetyFlagSlug,
} from "./flagDefinitions";
import {
  flagsAmong,
  flagsLeaving,
  includesFlags,
  isFlaggable,
  matchesFlagFilter,
  restrictRows,
  summariseTotals,
  type FlagFilter,
  type FlagTotals,
} from "./flagSummary";
import { computeMutualGreens } from "./mutualGreens";
import { listPlayers, playerLabel } from "./players";
import type { UiStatus } from "./playerStatus";
import type { FlagDefinition, Flags, FlagSlug } from "./types";
import { Forbidden } from "./vetting";

export { summariseTotals, type FlagTotals } from "./flagSummary";

export const emptyFlags: Flags = { flags: {}, completed: false };

/** A signed-in user acting on their own flags: a `Viewer` satisfies this. */
export interface FlaggingActor extends ViewerLike {
  user: ViewerLike["user"] & Pick<User, "id" | "publicKey">;
  keys: Keys;
}

/** A person in the Flagging view. `values` is absent in the names-only mode. */
export interface FlaggablePerson {
  userId: string;
  name: string;
  discordHandle: string | null;
  values?: Record<string, unknown>;
}

function stringValue(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

const collator = new Intl.Collator("fi");

function byName(a: FlaggablePerson, b: FlaggablePerson): number {
  return collator.compare(a.name, b.name);
}

export function assertCanEditFlags(actor: ViewerLike, now: Date): void {
  if (!canEditFlags(actor, now)) throw new Forbidden();
}

/** The viewer's own flags (SELF wrap); the default blob if they have not flagged anyone. */
export async function readOwnFlags(
  actor: Pick<FlaggingActor, "user" | "keys">,
  q: Queryable = db,
): Promise<Flags> {
  return (
    (await readRecord(RecordKind.FLAGS, actor.user.id, actor.keys, q)) ??
    emptyFlags
  );
}

/**
 * The other users in the viewer's Flagging view, by name. In the names-only mode, only the
 * names of those the viewer has flagged (withdrawn ones included); otherwise every other
 * ENTERED user whose vetting response is completed, with their answers, narrowed to the
 * viewer's `selectedPeers` once the casting is completed. Empty for `none`.
 */
export async function listFlaggable(
  actor: FlaggingActor,
  now: Date,
): Promise<FlaggablePerson[]> {
  const mode = flaggingMode(actor, now);
  if (mode === "none") return [];

  const [users, responses] = await Promise.all([
    db.orm.public.User.select("id", "status").all(),
    readAllRecords(RecordKind.VETTING_RESPONSE, actor.keys),
  ]);
  const person = (userId: string): FlaggablePerson => {
    const values = responses.get(userId)?.values ?? {};
    const discordHandle = stringValue(values[magicSlugs.discordHandle]);
    return {
      userId,
      name: stringValue(values[magicSlugs.name]) ?? discordHandle ?? "",
      discordHandle,
    };
  };

  if (mode === "names-only") {
    const own = await readOwnFlags(actor);
    const known = new Set(users.map((user) => user.id));
    return Object.keys(own.flags)
      .filter((id) => known.has(id) && id !== actor.user.id)
      .map(person)
      .sort(byName);
  }

  // After casting completion a selected viewer keeps seeing the other selected players only.
  const peers =
    actor.castingResult?.result === "SELECTED"
      ? new Set(actor.castingResult.selectedPeers)
      : null;
  return users
    .filter((user) => !peers || peers.has(user.id))
    .filter((user) =>
      isFlaggable(
        {
          id: user.id,
          status: user.status,
          vettingCompleted: responses.get(user.id)?.completed ?? false,
        },
        actor.user.id,
      ),
    )
    .map((user) => ({
      ...person(user.id),
      values: responses.get(user.id)!.values,
    }))
    .sort(byName);
}

async function assertFlaggable(
  actor: FlaggingActor,
  targetId: string,
  q: Queryable,
): Promise<void> {
  const target = await q.orm.public.User.select("id", "status").first({
    id: targetId,
  });
  if (!target) throw new Forbidden();
  if (
    actor.castingResult?.result === "SELECTED" &&
    !actor.castingResult.selectedPeers.includes(targetId)
  ) {
    throw new Forbidden();
  }
  const response = await readRecord(
    RecordKind.VETTING_RESPONSE,
    targetId,
    actor.keys,
    q,
  );
  const flaggable = isFlaggable(
    {
      id: target.id,
      status: target.status,
      vettingCompleted: response?.completed ?? false,
    },
    actor.user.id,
  );
  if (!flaggable) throw new Forbidden();
}

async function writeOwnFlags(
  actor: FlaggingActor,
  flags: Flags,
  tx: Queryable,
): Promise<void> {
  await writeRecord(
    RecordKind.FLAGS,
    actor.user.id,
    flags,
    ["SELF", "GM"],
    actor.keys,
    { ownerPublicKey: fromBase64Url(actor.user.publicKey), tx },
  );
}

/**
 * Sets the viewer's flag on `targetId`; `neutral` removes it. Refused (`Forbidden`) outside the
 * flagging period, for a flag the event does not define and for anyone not currently in the
 * viewer's Flagging view.
 */
export async function setFlag(
  actor: FlaggingActor,
  targetId: string,
  choice: FlagSlug,
  now: Date,
): Promise<Flags> {
  assertCanEditFlags(actor, now);
  if (
    choice !== neutralFlagSlug &&
    !isConfiguredFlag(choice, actor.settings.flags)
  ) {
    throw new Forbidden();
  }
  return db.transaction(async (tx: Transaction) => {
    await assertFlaggable(actor, targetId, tx);
    const existing = await readOwnFlags(actor, tx);
    const flags = { ...existing.flags };
    if (choice === neutralFlagSlug) delete flags[targetId];
    else flags[targetId] = choice;
    const updated = { ...existing, flags };
    await writeOwnFlags(actor, updated, tx);
    return updated;
  });
}

/** Marks the viewer's flagging as reviewed (or not). */
export async function setFlagsCompleted(
  actor: FlaggingActor,
  completed: boolean,
  now: Date,
): Promise<Flags> {
  assertCanEditFlags(actor, now);
  return db.transaction(async (tx: Transaction) => {
    const existing = await readOwnFlags(actor, tx);
    const updated = { ...existing, completed };
    await writeOwnFlags(actor, updated, tx);
    return updated;
  });
}

/**
 * The SELECTED players who flagged the viewer `green` and whom the viewer flagged `green`, from the
 * viewer's `CASTING_RESULT` (only loaded once the casting is completed).
 */
export function mutualGreensFor(
  viewer: Pick<ViewerLike, "castingResult">,
): Set<string> {
  const result = viewer.castingResult;
  if (!result || result.result !== "SELECTED") return new Set();
  return new Set(result.mutualGreens);
}

// ---------------------------------------------------------------------------------------------
// GM: the Flags view

/** Every flagger's flags blob, by flagger id. GM keys required. */
export function readAllFlags(
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<Map<string, Flags>> {
  return readAllRecords(RecordKind.FLAGS, keys, q);
}

export interface FlagMatrixUser {
  userId: string;
  name: string;
  discordHandle: string | null;
  uiStatus: UiStatus;
  withdrawn: boolean;
  /** The user's own flagging is marked completed. */
  completed: boolean;
}

export interface FlagMatrix {
  /**
   * Accepted users (ENTERED, WITHDRAWN) and anyone else with flags, by name, narrowed by the
   * filter.
   */
  users: FlagMatrixUser[];
  /**
   * flagger id → target id → flag slug, for the completed flaggers and the flags the event
   * currently defines, between `users` only.
   */
  rows: Record<string, Record<string, FlagSlug>>;
  totals: Record<string, FlagTotals>;
  /** user id → the users they flagged `green` who flagged them `green`, for everyone in `users`. */
  mutualGreens: Record<string, string[]>;
  /** The stored (non-neutral) flags of the event, in screen order: the columns of the totals. */
  flags: FlagDefinition[];
  /** Red flags given by a SELECTED user to another, whatever the filter. */
  selectedRedFlags: { from: FlagMatrixUser; to: FlagMatrixUser }[];
  /** Safety players designated by a SELECTED user who are not SELECTED, whatever the filter. */
  selectedSafetyOutside: { from: FlagMatrixUser; to: FlagMatrixUser }[];
}

/**
 * The matrix, decrypted in the GM's session, between the users matching `filter`. Only flaggers
 * who have marked their flagging completed count. A flag whose slug the event no longer defines
 * counts as neutral and is left out.
 */
export async function flagMatrix(
  keys: AudienceKeys,
  definitions: readonly FlagDefinition[],
  filter: FlagFilter = "all",
): Promise<FlagMatrix> {
  const [players, blobs] = await Promise.all([
    listPlayers(keys),
    readAllFlags(keys),
  ]);
  const flags = nonNeutralFlags(definitions);
  const allRows: Record<string, Record<string, FlagSlug>> = {};
  const involved = new Set<string>();
  for (const [flaggerId, blob] of blobs) {
    if (!includesFlags(blob)) continue;
    const row = Object.fromEntries(
      Object.entries(blob.flags).filter(([, slug]) =>
        isConfiguredFlag(slug, flags),
      ),
    );
    allRows[flaggerId] = row;
    involved.add(flaggerId);
    for (const targetId of Object.keys(row)) involved.add(targetId);
  }
  const accepted = players
    .filter(
      (row) =>
        row.status === UserStatus.ENTERED ||
        row.status === UserStatus.WITHDRAWN ||
        involved.has(row.id),
    )
    .map((row): FlagMatrixUser => ({
      userId: row.id,
      name: playerLabel(row),
      discordHandle: row.discordHandle,
      uiStatus: row.uiStatus,
      withdrawn: row.status === UserStatus.WITHDRAWN,
      completed: blobs.get(row.id)?.completed ?? false,
    }));
  const byId = new Map(accepted.map((user) => [user.userId, user]));
  const selectedIds = accepted
    .filter((user) => user.uiStatus === "SELECTED")
    .map((user) => user.userId);
  const users = accepted.filter((user) =>
    matchesFlagFilter(user.uiStatus, filter),
  );
  const userIds = users.map((user) => user.userId);
  const rows = restrictRows(allRows, userIds);
  const toUsers = ([fromId, toId]: [string, string]) => ({
    from: byId.get(fromId)!,
    to: byId.get(toId)!,
  });
  return {
    users,
    rows,
    totals: summariseTotals(
      rows,
      flags.map((flag) => flag.slug),
      userIds,
    ),
    mutualGreens: Object.fromEntries(
      computeMutualGreens(new Map(Object.entries(rows)), userIds),
    ),
    flags,
    selectedRedFlags: flagsAmong(allRows, selectedIds, redFlagSlug).map(
      toUsers,
    ),
    selectedSafetyOutside: flagsLeaving(
      allRows,
      selectedIds,
      safetyFlagSlug,
    ).map(toUsers),
  };
}

export interface PersonFlags {
  person: FlagMatrixUser;
  inbound: { from: FlagMatrixUser; slug: FlagSlug }[];
  outbound: { to: FlagMatrixUser; slug: FlagSlug }[];
  mutualGreens: string[];
}

/**
 * One person's inbound and outbound flags with the users matching `filter`, or null if the
 * person is not in the matrix. The person is shown whatever their own status.
 */
export async function flagsForPerson(
  keys: AudienceKeys,
  userId: string,
  definitions: readonly FlagDefinition[],
  filter: FlagFilter = "all",
): Promise<PersonFlags | null> {
  const matrix = await flagMatrix(keys, definitions);
  const person = matrix.users.find((user) => user.userId === userId);
  if (!person) return null;
  const others = matrix.users.filter(
    (user) =>
      user.userId !== userId && matchesFlagFilter(user.uiStatus, filter),
  );
  const included = new Set(others.map((user) => user.userId));
  return {
    person,
    inbound: others.flatMap((from) => {
      const slug = matrix.rows[from.userId]?.[userId];
      return slug ? [{ from, slug }] : [];
    }),
    outbound: others.flatMap((to) => {
      const slug = matrix.rows[userId]?.[to.userId];
      return slug ? [{ to, slug }] : [];
    }),
    mutualGreens: matrix.mutualGreens[userId].filter((id) => included.has(id)),
  };
}

/**
 * Removes every flag on `targetId` from the other users' blobs, rewriting only the blobs that
 * had one. The data keys are opened through the GM wrap and kept, so the flaggers can still read
 * their blobs. Returns the number of blobs rewritten.
 */
export async function removeFlagsOn(
  targetId: string,
  keys: AudienceKeys,
  tx: Queryable,
): Promise<number> {
  let rewritten = 0;
  for (const [ownerId, blob] of await readAllFlags(keys, tx)) {
    if (ownerId === targetId || !(targetId in blob.flags)) continue;
    const flags = { ...blob.flags };
    delete flags[targetId];
    await writeRecord(
      RecordKind.FLAGS,
      ownerId,
      { ...blob, flags },
      ["SELF", "GM"],
      keys,
      { tx },
    );
    rewritten++;
  }
  return rewritten;
}

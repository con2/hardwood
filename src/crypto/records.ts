/**
 * Encrypted record I/O. Every record has a random data key; its content is AES-GCM under that
 * key with the row id (or table key) as additional authenticated data, and the data key is
 * wrapped to the record's audiences:
 *
 * - INVITEE: AES-GCM under the INVITEE audience key (`inviteeKeyWrap`)
 * - GM: sealed to the GM audience public key, `Event.gmPublicKey` (`gmKeyWrap`), so that
 *   non-GMs can write records the GMs can read; opened with the GM audience key
 * - SELF: sealed to the owner's public key (`selfKeyWrap`)
 */
import { randomUUID } from "node:crypto";

import { db, type Queryable } from "@/prisma/db";
import type { RecordKind, SurveySlug } from "@/prisma/enums";
import type { Field } from "@/components/forms/models";
import type { EventSettings, RecordContents } from "@/models/types";

import { hasIdentity, type AudienceKeys, type Keys } from "./keys";
import {
  DecryptionError,
  decryptJson,
  encryptJson,
  fromBase64Url,
  open,
  randomKey,
  seal,
  unwrap,
  wrap,
} from "./primitives";

export type Audience = "INVITEE" | "GM" | "SELF";

/** No wrap of the record could be opened with the caller's keys. */
export class CannotDecrypt extends Error {
  constructor(what: string) {
    super(`Cannot decrypt ${what}`);
    this.name = "CannotDecrypt";
  }
}

export class NotInitialized extends Error {
  constructor() {
    super("The event has not been initialised");
    this.name = "NotInitialized";
  }
}

interface Wraps {
  inviteeKeyWrap: string | null;
  gmKeyWrap: string | null;
  selfKeyWrap: string | null;
}

function tryOpen(fn: () => Uint8Array): Uint8Array | null {
  try {
    return fn();
  } catch (error) {
    if (error instanceof DecryptionError) return null;
    throw error;
  }
}

/** Opens a data key with whichever wrap the caller's keys can open: SELF, INVITEE, GM. */
function openDataKey(
  row: Wraps,
  ownerId: string | null,
  keys: AudienceKeys | Keys,
): Uint8Array | null {
  if (row.selfKeyWrap && hasIdentity(keys) && ownerId === keys.userId) {
    const key = tryOpen(() => open(row.selfKeyWrap!, keys.privateKey));
    if (key) return key;
  }
  if (row.inviteeKeyWrap) {
    const key = tryOpen(() => unwrap(row.inviteeKeyWrap!, keys.inviteeKey));
    if (key) return key;
  }
  if (row.gmKeyWrap && keys.gmKey) {
    const key = tryOpen(() => open(row.gmKeyWrap!, keys.gmKey!));
    if (key) return key;
  }
  return null;
}

async function getGmPublicKey(q: Queryable): Promise<Uint8Array> {
  const event = await q.orm.public.Event.select("gmPublicKey").first({ id: 1 });
  if (!event) throw new NotInitialized();
  return fromBase64Url(event.gmPublicKey);
}

async function getUserPublicKey(
  q: Queryable,
  userId: string,
): Promise<Uint8Array> {
  const user = await q.orm.public.User.select("publicKey").first({
    id: userId,
  });
  if (!user) throw new Error("User not found");
  return fromBase64Url(user.publicKey);
}

// ---------------------------------------------------------------------------------------------
// EncryptedRecord

export async function readRecord<K extends RecordKind>(
  kind: K,
  ownerId: string,
  keys: AudienceKeys | Keys,
  q: Queryable = db,
): Promise<RecordContents[K] | null> {
  const row = await q.orm.public.EncryptedRecord.where({
    kind,
    ownerId,
  }).first();
  if (!row) return null;
  const dataKey = openDataKey(row, ownerId, keys);
  if (!dataKey) throw new CannotDecrypt(kind);
  try {
    return decryptJson<RecordContents[K]>(row.ciphertext, dataKey, row.id);
  } catch (error) {
    if (error instanceof DecryptionError) throw new CannotDecrypt(kind);
    throw error;
  }
}

export interface WriteRecordOptions {
  /** The owner's public key for the SELF wrap; looked up from the user row if omitted. */
  ownerPublicKey?: Uint8Array;
  tx?: Queryable;
}

/**
 * Upserts a record. Reuses the existing data key if the caller can open it, else creates one,
 * and produces exactly the wraps for `audiences` (other wraps are cleared).
 */
export async function writeRecord<K extends RecordKind>(
  kind: K,
  ownerId: string,
  content: RecordContents[K],
  audiences: Audience[],
  keys: AudienceKeys | Keys,
  { ownerPublicKey, tx = db }: WriteRecordOptions = {},
): Promise<void> {
  const existing = await tx.orm.public.EncryptedRecord.where({
    kind,
    ownerId,
  }).first();
  const dataKey =
    (existing && openDataKey(existing, ownerId, keys)) || randomKey();

  const wraps: Wraps = {
    inviteeKeyWrap: null,
    gmKeyWrap: null,
    selfKeyWrap: null,
  };
  if (audiences.includes("INVITEE")) {
    wraps.inviteeKeyWrap = wrap(dataKey, keys.inviteeKey);
  }
  if (audiences.includes("GM")) {
    wraps.gmKeyWrap = seal(dataKey, await getGmPublicKey(tx));
  }
  if (audiences.includes("SELF")) {
    const publicKey = ownerPublicKey ?? (await getUserPublicKey(tx, ownerId));
    wraps.selfKeyWrap = seal(dataKey, publicKey);
  }

  if (existing) {
    await tx.orm.public.EncryptedRecord.where({ id: existing.id }).update({
      ciphertext: encryptJson(content, dataKey, existing.id),
      ...wraps,
    });
  } else {
    const id = randomUUID();
    await tx.orm.public.EncryptedRecord.create({
      id,
      kind,
      ownerId,
      ciphertext: encryptJson(content, dataKey, id),
      ...wraps,
    });
  }
}

/**
 * After a password reset gives the owner a new key pair: re-seal every SELF-wrapped data key of
 * theirs to the new public key, opening it through the GM wrap.
 */
export async function rewrapSelfKeys(
  userId: string,
  gmKey: Uint8Array,
  newPublicKey: Uint8Array,
  tx: Queryable = db,
): Promise<void> {
  const rows = await tx.orm.public.EncryptedRecord.where({ ownerId: userId })
    .where((r) => r.selfKeyWrap.isNotNull())
    .all();
  for (const row of rows) {
    if (!row.gmKeyWrap) throw new CannotDecrypt(row.kind);
    const dataKey = tryOpen(() => open(row.gmKeyWrap!, gmKey));
    if (!dataKey) throw new CannotDecrypt(row.kind);
    await tx.orm.public.EncryptedRecord.where({ id: row.id }).update({
      selfKeyWrap: seal(dataKey, newPublicKey),
    });
  }
}

// ---------------------------------------------------------------------------------------------
// Event settings and survey schemas (INVITEE)

const eventAad = "event";

export async function readEventSettings(
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<EventSettings> {
  const event = await q.orm.public.Event.first({ id: 1 });
  if (!event) throw new NotInitialized();
  const dataKey = tryOpen(() => unwrap(event.inviteeKeyWrap, keys.inviteeKey));
  if (!dataKey) throw new CannotDecrypt("event settings");
  return decryptJson<EventSettings>(event.ciphertext, dataKey, eventAad);
}

/** Updates the settings of an initialised event (see `src/models/bootstrap.ts` for creation). */
export async function writeEventSettings(
  settings: EventSettings,
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<void> {
  const event = await q.orm.public.Event.first({ id: 1 });
  if (!event) throw new NotInitialized();
  const dataKey =
    tryOpen(() => unwrap(event.inviteeKeyWrap, keys.inviteeKey)) ?? randomKey();
  await q.orm.public.Event.where({ id: 1 }).update({
    ciphertext: encryptJson(settings, dataKey, eventAad),
    inviteeKeyWrap: wrap(dataKey, keys.inviteeKey),
  });
}

/** Encrypts event settings for a new `Event` row. */
export function encryptEventSettings(
  settings: EventSettings,
  keys: AudienceKeys,
): { ciphertext: string; inviteeKeyWrap: string } {
  const dataKey = randomKey();
  return {
    ciphertext: encryptJson(settings, dataKey, eventAad),
    inviteeKeyWrap: wrap(dataKey, keys.inviteeKey),
  };
}

export async function readSurvey(
  slug: SurveySlug,
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<Field[]> {
  const survey = await q.orm.public.Survey.first({ slug });
  if (!survey) throw new NotInitialized();
  const dataKey = tryOpen(() => unwrap(survey.inviteeKeyWrap, keys.inviteeKey));
  if (!dataKey) throw new CannotDecrypt(`survey ${slug}`);
  return decryptJson<Field[]>(survey.ciphertext, dataKey, slug);
}

/** Upserts a survey schema. */
export async function writeSurvey(
  slug: SurveySlug,
  fields: Field[],
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<void> {
  const existing = await q.orm.public.Survey.first({ slug });
  const dataKey =
    (existing &&
      tryOpen(() => unwrap(existing.inviteeKeyWrap, keys.inviteeKey))) ||
    randomKey();
  const data = {
    ciphertext: encryptJson(fields, dataKey, slug),
    inviteeKeyWrap: wrap(dataKey, keys.inviteeKey),
  };
  if (existing) {
    await q.orm.public.Survey.where({ slug }).update(data);
  } else {
    await q.orm.public.Survey.create({ slug, ...data });
  }
}

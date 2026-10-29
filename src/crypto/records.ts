/**
 * Encrypted record I/O. Every record has a random data key; its content is AES-GCM under that
 * key with the record's id, kind and owner (or the table key) as additional authenticated data,
 * and the data key is wrapped to the record's audiences:
 *
 * - INVITEE: AES-GCM under the INVITEE audience key (`inviteeKeyWrap`)
 * - GM: sealed to the GM audience public key (`gmKeyWrap`), so that non-GMs can write records
 *   the GMs can read; opened with the GM audience key
 * - SELF: sealed to the owner's public key (`selfKeyWrap`)
 *
 * Public keys come from the database only after verification: the GM key from the deployment
 * (`gmPublicKeyFor`), user keys through their binding (`verifiedPublicKey`).
 *
 * Since anyone can seal to the GM key, the GM wrap alone does not show who wrote a record. Each
 * record therefore carries `mac`, which only holders of the INVITEE key can compute.
 */
import { randomUUID } from "node:crypto";

import { pinnedGmPublicKey, requirePinnedGmPublicKey } from "@/config";
import { db, type Queryable } from "@/prisma/db";
import type { RecordKind, SurveySlug } from "@/prisma/enums";
import type { Field } from "@/components/forms/models";
import {
  defaultFlagDefinitions,
  withDefaultFlags,
} from "@/models/flagDefinitions";
import {
  defaultEventSettings,
  type EventSettings,
  type RecordContents,
} from "@/models/types";
import { getTranslations } from "@/translations";

import {
  hasIdentity,
  verifiedPublicKey,
  type AudienceKeys,
  type Keys,
} from "./keys";
import {
  blobVersion,
  DecryptionError,
  decryptJson,
  deriveSubkey,
  encryptJson,
  fromBase64Url,
  hmac,
  hmacEquals,
  open,
  publicKeyFromPrivate,
  randomKey,
  recordFormatVersion,
  seal,
  toBase64Url,
  unwrap,
  wrap,
  type RecordIdentity,
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

export class GmKeyMismatch extends Error {
  constructor() {
    super("The GM key does not match the GM public key");
    this.name = "GmKeyMismatch";
  }
}

/**
 * The public key to seal data keys to for the GM audience. Holders of the GM key derive it; other
 * sessions use `GM_PUBLIC_KEY` from the deployment. Only outside production, and only without
 * that variable, is `Event.gmPublicKey` trusted.
 */
export async function gmPublicKeyFor(
  keys: AudienceKeys,
  q: Queryable = db,
): Promise<Uint8Array> {
  if (keys.gmKey) return publicKeyFromPrivate(keys.gmKey);
  if (pinnedGmPublicKey) return fromBase64Url(pinnedGmPublicKey);
  if (requirePinnedGmPublicKey) {
    throw new Error("GM_PUBLIC_KEY must be set in production");
  }
  const event = await q.orm.public.Event.select("gmPublicKey").first({ id: 1 });
  if (!event) throw new NotInitialized();
  return fromBase64Url(event.gmPublicKey);
}

/**
 * Throws `GmKeyMismatch` unless the public half of `gmKey` equals `Event.gmPublicKey` and, if
 * set, `GM_PUBLIC_KEY`: a replaced Event row or a stale deployment value then fails loudly
 * instead of leaving invitees sealing to a key the GMs cannot open.
 */
export async function verifyGmKey(
  gmKey: Uint8Array,
  q: Queryable = db,
): Promise<void> {
  const expected = toBase64Url(publicKeyFromPrivate(gmKey));
  const event = await q.orm.public.Event.select("gmPublicKey").first({ id: 1 });
  if (!event) throw new NotInitialized();
  if (
    event.gmPublicKey !== expected ||
    (pinnedGmPublicKey && pinnedGmPublicKey !== expected)
  ) {
    throw new GmKeyMismatch();
  }
}

async function getUserPublicKey(
  q: Queryable,
  userId: string,
  inviteeKey: Uint8Array,
): Promise<Uint8Array> {
  const user = await q.orm.public.User.select(
    "id",
    "publicKey",
    "publicKeyBinding",
  ).first({ id: userId });
  if (!user) throw new Error("User not found");
  return verifiedPublicKey(user, inviteeKey);
}

// ---------------------------------------------------------------------------------------------
// EncryptedRecord

const recordMacInfo = "hardwood-record-mac-v1";

type RecordRow = Wraps &
  RecordIdentity & {
    kind: RecordKind;
    ciphertext: string;
    mac: string | null;
  };

/** The `mac` of a record: HMAC-SHA256 over its format version, identity and ciphertext. */
export function recordMac(
  { id, kind, ownerId }: RecordIdentity,
  ciphertext: string,
  inviteeKey: Uint8Array,
): string {
  return hmac(
    deriveSubkey(inviteeKey, recordMacInfo),
    `${blobVersion(ciphertext)}|${id}|${kind}|${ownerId}|${ciphertext}`,
  );
}

function verifyRecordMac(row: RecordRow, inviteeKey: Uint8Array): boolean {
  return (
    !!row.mac && hmacEquals(row.mac, recordMac(row, row.ciphertext, inviteeKey))
  );
}

/**
 * Throws `CannotDecrypt` unless the caller's keys open the record and its mac verifies. Records
 * of format version 1 (aad = id, no mac) are refused: anyone who can seal to the GM key could
 * have written one.
 */
function decryptRecord<K extends RecordKind>(
  row: RecordRow,
  keys: AudienceKeys | Keys,
): RecordContents[K] {
  const dataKey = openDataKey(row, row.ownerId, keys);
  if (!dataKey) throw new CannotDecrypt(row.kind);
  try {
    if (
      blobVersion(row.ciphertext) !== recordFormatVersion ||
      !verifyRecordMac(row, keys.inviteeKey)
    ) {
      throw new CannotDecrypt(row.kind);
    }
    return decryptJson<RecordContents[K]>(row.ciphertext, dataKey, row);
  } catch (error) {
    if (error instanceof DecryptionError) throw new CannotDecrypt(row.kind);
    throw error;
  }
}

/**
 * Rewrites a record of format version 1 in the current format, with the same data key and
 * audiences. For `npm run upgrade` only: it trusts the record, which readers no longer do.
 */
export async function upgradeVersion1Record(
  row: RecordRow,
  keys: AudienceKeys,
  tx: Queryable,
): Promise<void> {
  const dataKey = openDataKey(row, row.ownerId, keys);
  if (!dataKey) throw new CannotDecrypt(row.kind);
  let content: RecordContents[RecordKind];
  try {
    content = decryptJson(row.ciphertext, dataKey, row.id);
  } catch (error) {
    if (error instanceof DecryptionError) throw new CannotDecrypt(row.kind);
    throw error;
  }
  const audiences: Audience[] = [];
  if (row.inviteeKeyWrap) audiences.push("INVITEE");
  if (row.gmKeyWrap) audiences.push("GM");
  if (row.selfKeyWrap) audiences.push("SELF");
  await writeRecord(row.kind, row.ownerId, content, audiences, keys, { tx });
}

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
  return row ? decryptRecord<K>(row, keys) : null;
}

/**
 * Every record of `kind`, decrypted, by owner id. One query; for views that list all users
 * (about 60 rows). Throws `CannotDecrypt` if any record cannot be opened with `keys`.
 */
export async function readAllRecords<K extends RecordKind>(
  kind: K,
  keys: AudienceKeys | Keys,
  q: Queryable = db,
): Promise<Map<string, RecordContents[K]>> {
  const rows = await q.orm.public.EncryptedRecord.where({ kind }).all();
  return new Map(rows.map((row) => [row.ownerId, decryptRecord<K>(row, keys)]));
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
    wraps.gmKeyWrap = seal(dataKey, await gmPublicKeyFor(keys, tx));
  }
  if (audiences.includes("SELF")) {
    const publicKey =
      ownerPublicKey ?? (await getUserPublicKey(tx, ownerId, keys.inviteeKey));
    wraps.selfKeyWrap = seal(dataKey, publicKey);
  }

  const identity = { id: existing?.id ?? randomUUID(), kind, ownerId };
  const ciphertext = encryptJson(content, dataKey, identity);
  const sealed = {
    ciphertext,
    mac: recordMac(identity, ciphertext, keys.inviteeKey),
    ...wraps,
  };
  if (existing) {
    await tx.orm.public.EncryptedRecord.where({ id: existing.id }).update(
      sealed,
    );
  } else {
    await tx.orm.public.EncryptedRecord.create({ ...identity, ...sealed });
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
  const stored = decryptJson<Partial<EventSettings>>(
    event.ciphertext,
    dataKey,
    eventAad,
  );
  // Keys added since the row was written are filled in; flags fall back to the translated
  // defaults until the GMs save the Choices tab.
  return withDefaultFlags(
    { ...defaultEventSettings, ...stored },
    defaultFlagDefinitions(getTranslations().Flagging.defaultFlags),
  );
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

/**
 * Re-encrypts the event settings and every survey schema under their data keys (which applies
 * the current padding) and wraps the data keys under `newInviteeKey`, which may be the current
 * INVITEE key.
 */
export async function rewriteEventSettingsAndSurveys(
  keys: AudienceKeys,
  newInviteeKey: Uint8Array,
  q: Queryable = db,
): Promise<void> {
  const event = await q.orm.public.Event.first({ id: 1 });
  if (!event) throw new NotInitialized();
  const eventKey = unwrap(event.inviteeKeyWrap, keys.inviteeKey);
  await q.orm.public.Event.where({ id: 1 }).update({
    ciphertext: encryptJson(
      decryptJson(event.ciphertext, eventKey, eventAad),
      eventKey,
      eventAad,
    ),
    inviteeKeyWrap: wrap(eventKey, newInviteeKey),
  });
  for (const survey of await q.orm.public.Survey.all()) {
    const surveyKey = unwrap(survey.inviteeKeyWrap, keys.inviteeKey);
    await q.orm.public.Survey.where({ slug: survey.slug }).update({
      ciphertext: encryptJson(
        decryptJson(survey.ciphertext, surveyKey, survey.slug),
        surveyKey,
        survey.slug,
      ),
      inviteeKeyWrap: wrap(surveyKey, newInviteeKey),
    });
  }
}

/**
 * Event initialisation, shared by `src/bin/init.ts` and the integration tests.
 */
import type { AudienceKeys } from "@/crypto/keys";
import {
  generateKeyPair,
  randomKey,
  toBase64Url,
  wrap,
} from "@/crypto/primitives";
import { encryptEventSettings, writeSurvey } from "@/crypto/records";
import { magicSlugs, type Field } from "@/components/forms/models";
import { db, type Transaction } from "@/prisma/db";
import { SurveySlug } from "@/prisma/enums";

import { defaultEventSettings, type FlagDefinition } from "./types";
import { createInvite, type CreatedInvite } from "./user";

export class AlreadyInitialized extends Error {
  constructor() {
    super("The event has already been initialised");
    this.name = "AlreadyInitialized";
  }
}

export const defaultVettingSurvey: Field[] = [
  { type: "SingleLineText", slug: magicSlugs.name, required: true },
  { type: "SingleLineText", slug: magicSlugs.discordHandle, required: true },
];

export interface Initialized extends CreatedInvite {
  /** base64url; printed once, never stored. Unwraps both audience keys. */
  recoveryKey: string;
  /** For tests; the command line forgets these. */
  keys: AudienceKeys;
}

/**
 * Generates the audience keys and the recovery key, writes the `Event` row (recovery wraps,
 * empty timeline and privacy policy, the given flags) and both surveys, and invites the first GM.
 * Refuses to run if the event exists.
 */
export async function initializeEvent({
  discordHandle,
  titles,
  flags,
}: {
  discordHandle: string;
  /** Titles of the default vetting survey fields, in the event's language. */
  titles: { name: string; discordHandle: string };
  /** The initial flags, in the event's language (`defaultFlagDefinitions`). */
  flags: FlagDefinition[];
}): Promise<Initialized> {
  if (await db.orm.public.Event.first({ id: 1 })) {
    throw new AlreadyInitialized();
  }

  const gm = generateKeyPair();
  const keys: AudienceKeys = { inviteeKey: randomKey(), gmKey: gm.privateKey };
  const recoveryKey = randomKey();

  const vettingSurvey = defaultVettingSurvey.map((field) => ({
    ...field,
    title: field.slug === magicSlugs.name ? titles.name : titles.discordHandle,
  }));

  const invite = await db.transaction(async (tx: Transaction) => {
    await tx.orm.public.Event.create({
      id: 1,
      ...encryptEventSettings({ ...defaultEventSettings, flags }, keys),
      privacyPolicy: "",
      gmPublicKey: toBase64Url(gm.publicKey),
      inviteeKeyRecoveryWrap: wrap(keys.inviteeKey, recoveryKey),
      gmKeyRecoveryWrap: wrap(keys.gmKey!, recoveryKey),
    });
    await writeSurvey(SurveySlug.vetting, vettingSurvey, keys, tx);
    await writeSurvey(SurveySlug.practical, [], keys, tx);
    return createInvite({ discordHandle, isGm: true }, keys, tx);
  });

  return { ...invite, recoveryKey: toBase64Url(recoveryKey), keys };
}

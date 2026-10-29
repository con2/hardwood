/**
 * Development seed: fake invitees in varied states so that every view has data. Local
 * databases only.
 *
 *   RECOVERY_KEY=… npm run seed:dev [-- --keep-timeline]
 *   npm run seed:dev -- --recovery-key <key> [--keep-timeline]
 *
 * The development recovery key is in `.dev-credentials.txt` (printed by `npm run init`). If the
 * event has not been initialised, this initialises it with the GM `japsu` and prints the new
 * credentials instead. Every seeded invitee has the password `salasana123`. Invitees whose
 * Discord handle already exists are skipped, so running this twice adds nothing.
 */
import "./loadEnv";

import { parseArgs } from "node:util";

import type { Field, Values } from "@/components/forms/models";
import { magicSlugs } from "@/components/forms/models";
import { cliSecret, databaseUrl } from "@/config";
import type { AudienceKeys } from "@/crypto/keys";
import { unlockWithRecoveryKey } from "@/crypto/recovery";
import {
  readAllRecords,
  readEventSettings,
  readSurvey,
  writeEventSettings,
  writeRecord,
  writeSurvey,
} from "@/crypto/records";
import { initializeEvent } from "@/models/bootstrap";
import {
  defaultFlagDefinitions,
  greenFlagSlug,
  nonNeutralFlags,
} from "@/models/flagDefinitions";
import type {
  CastingDecision,
  FlagSlug,
  PlayerAttributes,
} from "@/models/types";
import { createInvite, invitationUrl } from "@/models/user";
import { db } from "@/prisma/db";
import { RecordKind, SurveySlug, UserStatus } from "@/prisma/enums";
import { pool } from "@/prisma/pool";
import { getTranslations } from "@/translations";

const seedPassword = "salasana123";

class UsageError extends Error {}

type SeedState =
  "invited" | "revoked" | "completed" | "incomplete" | "withdrawn";

interface Person {
  name: string;
  handle: string;
  state: SeedState;
}

const people: Person[] = [
  { name: "Aino Virtanen", handle: "ainovee", state: "completed" },
  { name: "Eero Korhonen", handle: "eerokorho", state: "completed" },
  { name: "Helmi Mäkinen", handle: "helmi.m", state: "completed" },
  { name: "Ilmari Nieminen", handle: "ilmarin", state: "completed" },
  { name: "Kerttu Mäkelä", handle: "kerttu_m", state: "completed" },
  { name: "Lauri Hämäläinen", handle: "lauri.h", state: "completed" },
  { name: "Mirja Laine", handle: "mirjalaine", state: "completed" },
  { name: "Niko Heikkinen", handle: "nikoheikki", state: "completed" },
  { name: "Oona Koskinen", handle: "oonak", state: "completed" },
  { name: "Pekka Järvinen", handle: "pekkajee", state: "completed" },
  { name: "Riikka Lehtonen", handle: "riikkal", state: "completed" },
  { name: "Sampo Lehtinen", handle: "sampo_l", state: "completed" },
  { name: "Tuuli Saarinen", handle: "tuulisaari", state: "completed" },
  { name: "Ville Salminen", handle: "villesalm", state: "completed" },
  { name: "Venla Heinonen", handle: "venlah", state: "incomplete" },
  { name: "Joonas Niemi", handle: "joonasniemi", state: "incomplete" },
  { name: "Elina Kinnunen", handle: "elinak", state: "incomplete" },
  { name: "Antti Salonen", handle: "anttisalo", state: "withdrawn" },
  { name: "Siiri Turunen", handle: "siiritu", state: "withdrawn" },
  { name: "Matti Salo", handle: "mattisalo", state: "revoked" },
  { name: "Liisa Tuominen", handle: "liisatuo", state: "invited" },
  { name: "Jussi Rantanen", handle: "jussiran", state: "invited" },
  { name: "Hanna Karjalainen", handle: "hannakarja", state: "invited" },
  { name: "Tapio Lindholm", handle: "tapiol", state: "invited" },
];

/** Pairs (by handle) who green each other, on top of the random flags. */
const mutualGreenPairs: [string, string][] = [
  ["ainovee", "eerokorho"],
  ["helmi.m", "ilmarin"],
  ["kerttu_m", "lauri.h"],
];

const sampleVettingFields: Field[] = [
  {
    type: "MultiLineText",
    slug: "about",
    title: "Kerro itsestäsi pelaajana",
    required: true,
  },
  {
    type: "SingleSelect",
    slug: "experience",
    title: "Larppikokemus",
    required: true,
    choices: [
      { slug: "first", title: "Tämä olisi ensimmäinen larppini" },
      { slug: "some", title: "Muutama larppi takana" },
      { slug: "lots", title: "Paljon kokemusta" },
    ],
  },
  {
    type: "RadioMatrix",
    slug: "themes",
    title: "Teemat, joita haluat pelata",
    questions: [
      { slug: "romance", title: "Romantiikka" },
      { slug: "violence", title: "Väkivalta" },
      { slug: "bullying", title: "Kiusaaminen" },
    ],
    choices: [
      { slug: "no", title: "En halua" },
      { slug: "maybe", title: "Ehkä" },
      { slug: "yes", title: "Kyllä" },
    ],
  },
  {
    type: "MultiLineText",
    slug: "boundaries",
    title: "Rajat ja toiveet",
  },
];

const sentences = [
  "Pelaan mieluiten hahmoja, joilla on jokin salaisuus.",
  "Pidän hitaasti kehittyvistä ihmissuhteista ja pienistä eleistä.",
  "Olen pelannut lähinnä kotimaisia kampanjalarppeja.",
  "Haluan kokeilla jotain uutta ja vähän epämukavaa.",
  "Tärkeintä minulle on, että kaikilla on turvallinen olo.",
  "Nautin draamasta, mutta tarvitsen välillä hengähdystauon.",
  "Kirjoitan mielelläni hahmolleni taustaa etukäteen.",
  "Koulumiljöö tuo mieleen paljon muistoja, hyviä ja huonoja.",
  "Voin pelata myös ikävää hahmoa, kunhan off-game on selvä.",
  "Fyysinen kontakti sopii, kun siitä on sovittu etukäteen.",
];

/** Deterministic, so a fresh database always gets the same data. */
function mulberry32(seed: number) {
  let a = seed;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const random = mulberry32(1612);
const pick = <T>(items: readonly T[]): T =>
  items[Math.floor(random() * items.length)];
const chance = (p: number) => random() < p;

function text(count: number): string {
  return Array.from({ length: count }, () => pick(sentences)).join(" ");
}

/** Plausible answers to every field of the current schema; `partial` leaves some empty. */
function fillVetting(fields: Field[], person: Person, partial: boolean) {
  const values: Values = {
    [magicSlugs.name]: person.name,
    [magicSlugs.discordHandle]: person.handle,
  };
  for (const field of fields) {
    if (field.slug in values || (partial && chance(0.5))) continue;
    switch (field.type) {
      case "StaticText":
        break;
      case "SingleLineText":
        values[field.slug] = pick(sentences).split(",")[0].replace(/\.$/, "");
        break;
      case "MultiLineText":
      case "MarkdownText":
        values[field.slug] = [text(2), text(1)].join("\n\n");
        break;
      case "NumberField": {
        const min = field.minValue ?? 18;
        const max = field.maxValue ?? Math.max(min, 45);
        values[field.slug] = min + Math.floor(random() * (max - min + 1));
        break;
      }
      case "SingleSelect":
        if (field.choices.length) values[field.slug] = pick(field.choices).slug;
        break;
      case "MultiSelect":
        values[field.slug] = field.choices
          .filter(() => chance(0.4))
          .map((choice) => choice.slug);
        break;
      case "RadioMatrix":
        if (field.choices.length) {
          values[field.slug] = Object.fromEntries(
            field.questions.map((q) => [q.slug, pick(field.choices).slug]),
          );
        }
        break;
    }
  }
  return values;
}

function isLocalDatabase(url: string): boolean {
  const { hostname } = new URL(url);
  return ["", "localhost", "127.0.0.1", "::1", "[::1]"].includes(hostname);
}

async function unlock(recoveryKey: string | undefined): Promise<AudienceKeys> {
  if (!(await db.orm.public.Event.first({ id: 1 }))) {
    const init = await initializeEvent({
      discordHandle: "japsu",
      titles: getTranslations().VettingSurvey,
      flags: defaultFlagDefinitions(getTranslations().Flagging.defaultFlags),
    });
    process.stdout.write(
      [
        "The event was not initialised; initialised it now.",
        `GM invitation link: ${invitationUrl(init.token)}`,
        `Initial password:   ${init.initialPassword}`,
        `Recovery key:       ${init.recoveryKey}`,
        "Store these in .dev-credentials.txt.",
        "",
      ].join("\n"),
    );
    return init.keys;
  }
  if (!recoveryKey) {
    throw new UsageError(
      "Give --recovery-key or set RECOVERY_KEY (copy it from .dev-credentials.txt).",
    );
  }
  return unlockWithRecoveryKey(recoveryKey);
}

async function main() {
  const { values: args } = parseArgs({
    options: {
      "recovery-key": { type: "string" },
      "keep-timeline": { type: "boolean", default: false },
    },
  });
  if (!isLocalDatabase(databaseUrl)) {
    throw new UsageError("seed:dev only runs against a local database.");
  }
  const keys = await unlock(args["recovery-key"] ?? cliSecret("RECOVERY_KEY"));

  // Settings: choices if there are none, and a timeline with sign-up open.
  const settings = await readEventSettings(keys);
  const day = 24 * 60 * 60 * 1000;
  const now = Date.now();
  const at = (offset: number) => new Date(now + offset).toISOString();
  await writeEventSettings(
    {
      ...settings,
      characterGroups: settings.characterGroups.length
        ? settings.characterGroups
        : [
            { slug: "oppilaat", title: "Oppilaat" },
            { slug: "opettajat", title: "Opettajat" },
            { slug: "henkilokunta", title: "Muu henkilökunta" },
          ],
      feeCategories: settings.feeCategories.length
        ? settings.feeCategories
        : [
            { slug: "normaali", title: "Normaali (120 €)" },
            { slug: "tuettu", title: "Tuettu (80 €)" },
            { slug: "tukija", title: "Tukija (160 €)" },
          ],
      ...(args["keep-timeline"]
        ? {}
        : {
            signupStartsAt: at(-2 * day),
            previewStartsAt: at(-1 * day),
            signupEndsAt: at(7 * day),
            flaggingStartsAt: null,
            flaggingEndsAt: at(14 * day),
          }),
    },
    keys,
  );
  const choices = await readEventSettings(keys);

  // A vetting survey with only the magic fields gets a few sample questions.
  let fields = await readSurvey(SurveySlug.vetting, keys);
  const magic: string[] = Object.values(magicSlugs);
  if (fields.every((field) => magic.includes(field.slug))) {
    fields = [...fields, ...sampleVettingFields];
    await writeSurvey(SurveySlug.vetting, fields, keys);
  }

  const existingHandles = new Set<string>();
  for (const response of (
    await readAllRecords(RecordKind.VETTING_RESPONSE, keys)
  ).values()) {
    const handle = response.values[magicSlugs.discordHandle];
    if (typeof handle === "string") existingHandles.add(handle);
  }

  const created: (Person & { id: string; url: string })[] = [];
  for (const person of people) {
    if (existingHandles.has(person.handle)) continue;
    const invite = await createInvite(
      {
        discordHandle: person.handle,
        isGm: false,
        initialPassword: seedPassword,
      },
      keys,
    );
    created.push({
      ...person,
      id: invite.userId,
      url: invitationUrl(invite.token),
    });

    if (person.state === "invited") continue;
    if (person.state === "revoked") {
      await db.orm.public.User.where({ id: invite.userId }).update({
        status: UserStatus.REVOKED,
      });
      continue;
    }
    // Accepted, with the seed password kept as their own.
    await db.orm.public.User.where({ id: invite.userId }).update({
      status:
        person.state === "withdrawn"
          ? UserStatus.WITHDRAWN
          : UserStatus.ENTERED,
      passwordPending: false,
    });
    await writeRecord(
      RecordKind.VETTING_RESPONSE,
      invite.userId,
      {
        values: fillVetting(fields, person, person.state === "incomplete"),
        completed: person.state !== "incomplete",
      },
      ["INVITEE"],
      keys,
    );
  }

  // Flags among the new invitees who completed their response (also those who withdrew since).
  const flaggers = created.filter(
    (p) => p.state === "completed" || p.state === "withdrawn",
  );
  const idOf = new Map(created.map((p) => [p.handle, p.id]));
  // Greens are weighted so that mutual ones occur.
  const flagSlugs = [
    ...nonNeutralFlags(settings.flags).map((flag) => flag.slug),
    greenFlagSlug,
  ];
  const flags = new Map<string, Record<string, FlagSlug>>();
  for (const flagger of flaggers) {
    if (!chance(0.8)) continue;
    const own: Record<string, FlagSlug> = {};
    for (const target of flaggers) {
      if (target.id === flagger.id || !chance(0.35)) continue;
      own[target.id] = pick(flagSlugs);
    }
    flags.set(flagger.id, own);
  }
  for (const [a, b] of mutualGreenPairs) {
    const idA = idOf.get(a);
    const idB = idOf.get(b);
    if (!idA || !idB) continue;
    flags.set(idA, { ...flags.get(idA), [idB]: greenFlagSlug });
    flags.set(idB, { ...flags.get(idB), [idA]: greenFlagSlug });
  }
  for (const [ownerId, own] of flags) {
    await writeRecord(
      RecordKind.FLAGS,
      ownerId,
      { flags: own, completed: chance(0.7) },
      ["SELF", "GM"],
      keys,
    );
  }

  // GM-edited attributes for some of those who entered.
  const characterNames = [
    "Rehtori Ahonen",
    "Vahtimestari Lampinen",
    "Ella",
    "Juho",
    "Opettaja Wikström",
    "Kaisa",
    "Mikael",
    "Terveydenhoitaja Ruusu",
  ];
  const entered = created.filter((p) => p.state === "completed");
  for (const [index, person] of entered.slice(0, 10).entries()) {
    const decision: CastingDecision | null =
      index < 5 ? "SELECTED" : index < 7 ? "NOT_SELECTED" : null;
    const attributes: PlayerAttributes = {
      castingDecision: decision,
      characterName: characterNames[index] ?? "",
      characterGroup: chance(0.8) ? pick(choices.characterGroups).slug : null,
      feeCategory: chance(0.7) ? pick(choices.feeCategories).slug : null,
      feePaid: chance(0.4),
    };
    await writeRecord(
      RecordKind.PLAYER_ATTRIBUTES,
      person.id,
      attributes,
      ["GM"],
      keys,
    );
  }

  if (created.length === 0) {
    process.stdout.write("All seed invitees exist already. Nothing added.\n");
    return;
  }
  const width = Math.max(...created.map((p) => p.handle.length));
  process.stdout.write(
    [
      `Seeded ${created.length} invitees. Password of every one: ${seedPassword}`,
      "",
      ...created.map(
        (p) => `${p.handle.padEnd(width)}  ${p.state.padEnd(10)}  ${p.url}`,
      ),
      "",
    ].join("\n"),
  );
}

main()
  .catch((error: unknown) => {
    if (error instanceof UsageError) {
      process.stderr.write(`${error.message}\n`);
    } else {
      process.stderr.write(
        `seed:dev failed: ${error instanceof Error ? `${error.name}: ${error.message}` : "error"}\n`,
      );
    }
    process.exitCode = 1;
  })
  .finally(() => pool.end());

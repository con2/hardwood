import { FormattedDateTime } from "@con2/components";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";

import { flaggingMode } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { magicSlugs, type Field } from "@/components/forms";
import { eventLocale, eventTimezone } from "@/config";
import { readSurvey } from "@/crypto/records";
import {
  flagChoices,
  listFlaggable,
  mutualGreensFor,
  readOwnFlags,
} from "@/models/flags";
import { SurveySlug } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { FlagBadge, FlaggingList } from "./FlaggingList";

const headerSlugs: readonly string[] = [
  magicSlugs.name,
  magicSlugs.discordHandle,
];

/** Name and Discord handle are in the card header; static texts keep their titles only. */
function cardFields(fields: Field[]): Field[] {
  return fields
    .filter((field) => !headerSlugs.includes(field.slug))
    .map((field) =>
      field.type === "StaticText" ? { ...field, helpText: undefined } : field,
    );
}

export default async function FlaggingPage() {
  const viewer = await requireViewer();
  const now = new Date();
  const mode = flaggingMode(viewer, now);
  if (mode === "none") notFound();

  const t = getTranslations();
  const m = t.Flagging;
  const [fields, people, own] = await Promise.all([
    mode === "names-only"
      ? Promise.resolve([])
      : readSurvey(SurveySlug.vetting, viewer.keys),
    listFlaggable(viewer, now),
    readOwnFlags(viewer),
  ]);

  const dateTime = (value: string) => (
    <strong>
      <FormattedDateTime
        value={value}
        locale={eventLocale}
        timezone={eventTimezone}
        includeWeekday
      />
    </strong>
  );
  const { flaggingStartsAt, signupEndsAt, flaggingEndsAt } = viewer.settings;
  const startsAt = flaggingStartsAt ?? signupEndsAt;

  let modeNote: ReactNode;
  switch (mode) {
    case "preview":
      modeNote = startsAt ? (
        <>
          {m.modes.preview} {dateTime(startsAt)}.
        </>
      ) : (
        m.modes.previewNotScheduled
      );
      break;
    case "flagging":
      modeNote = (
        <>
          {m.modes.flagging}
          {flaggingEndsAt ? (
            <>
              {" "}
              {m.modes.flaggingEndsAt} {dateTime(flaggingEndsAt)}.
            </>
          ) : null}
        </>
      );
      break;
    case "readonly":
      modeNote = m.modes.readonly;
      break;
    case "names-only":
      modeNote = m.modes.namesOnly;
      break;
  }

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{m.title}</h1>
      {mode !== "names-only" ? <p>{m.intro}</p> : null}
      <p className="fw-bold">{modeNote}</p>

      {mode !== "names-only" ? (
        <section className="card mb-4">
          <div className="card-body">
            <h2 className="h5 card-title">{m.coloursTitle}</h2>
            <dl className="mb-3">
              {flagChoices.map((choice) => (
                <div key={choice} className="d-flex gap-2 mb-2">
                  <dt className="flex-shrink-0">
                    <FlagBadge choice={choice} messages={m} />
                  </dt>
                  <dd className="mb-0">{m.definitions[choice]}</dd>
                </div>
              ))}
            </dl>
            <p className="mb-2 fw-bold">{m.safety}</p>
            <p className="mb-0 text-muted">{m.gmsSeeFlags}</p>
          </div>
        </section>
      ) : null}

      <FlaggingList
        mode={mode}
        fields={cardFields(fields)}
        people={people}
        flags={own.flags}
        completed={own.completed}
        mutualGreens={[...mutualGreensFor(viewer)]}
        messages={{ Flagging: m, SchemaForm: t.SchemaForm }}
      />
    </div>
  );
}

import { DateTimeInput, SubmitButton } from "@con2/components";

import { requireGm } from "@/auth/viewer";
import { eventLocale, eventTimezone } from "@/config";
import { getTranslations } from "@/translations";

import { saveTimeline } from "../actions";
import { readStatus, StructureView } from "../StructureView";
import { timelineKeys } from "./keys";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function TimelinePage({ searchParams }: Props) {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Structure;
  const { saved, error } = await readStatus(searchParams);

  return (
    <StructureView active="timeline" messages={m} saved={saved} error={error}>
      <p>{m.timeline.intro}</p>
      <p className="text-muted">
        {m.timeline.timezone} <strong>{eventTimezone}</strong>.
      </p>
      <form action={saveTimeline} style={{ maxWidth: "40rem" }}>
        {timelineKeys.map((key) => (
          <div className="mb-4" key={key}>
            <label htmlFor={`Timeline-${key}`} className="form-label fw-bold">
              {m.timeline.fields[key].title}
            </label>
            <DateTimeInput
              id={`Timeline-${key}`}
              name={key}
              defaultValue={viewer.settings[key] ?? undefined}
              locale={eventLocale}
              defaultTimezone={eventTimezone}
            />
            <div className="form-text">{m.timeline.fields[key].helpText}</div>
          </div>
        ))}
        <SubmitButton>{t.common.actions.save}</SubmitButton>
      </form>
    </StructureView>
  );
}

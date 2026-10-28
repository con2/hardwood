import { FormattedDateTime } from "@con2/components";
import { notFound } from "next/navigation";

import { canEditPractical, canSeePractical } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import {
  SchemaForm,
  SchemaFormResponse,
  validateRequired,
  type Values,
} from "@/components/forms";
import { SurveyEditor } from "@/components/SurveyEditor";
import { eventLocale, eventTimezone } from "@/config";
import { readSurvey } from "@/crypto/records";
import { getPhase } from "@/models/phase";
import { readOwnPractical } from "@/models/practical";
import { SurveySlug, UserStatus } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { savePracticalAnswers, setPracticalCompleted } from "./actions";

/** Selected players once the practical survey opens; withdrawn ones read-only (see permissions). */
export default async function PracticalPage() {
  const viewer = await requireViewer();
  const now = new Date();
  if (!canSeePractical(viewer, now)) notFound();
  const t = getTranslations();
  const m = t.Practical;

  const [fields, response] = await Promise.all([
    readSurvey(SurveySlug.practical, viewer.keys),
    readOwnPractical(viewer),
  ]);
  const values = response.values as Values;
  const { practicalEndsAt } = viewer.settings;

  if (canEditPractical(viewer, now)) {
    const fieldTitles = Object.fromEntries(
      fields.map((field) => [field.slug, field.title ?? field.slug]),
    );
    return (
      <div className="container mt-4 mb-4">
        <h1 className="mb-3">{m.title}</h1>
        <p>{m.intro}</p>
        {practicalEndsAt ? (
          <p>
            {m.practicalEndsAt}{" "}
            <strong>
              <FormattedDateTime
                value={practicalEndsAt}
                locale={eventLocale}
                timezone={eventTimezone}
                includeWeekday
              />
            </strong>
            .
          </p>
        ) : null}
        <p className="text-muted">{m.noEmail}</p>
        <SurveyEditor
          id="Practical"
          saveAction={savePracticalAnswers}
          setCompletedAction={setPracticalCompleted}
          fieldTitles={fieldTitles}
          initialCompleted={response.completed}
          initialMissing={validateRequired(fields, values)}
          locale={eventLocale}
          messages={{ Survey: m, Autosave: t.Autosave }}
        >
          <SchemaForm
            fields={fields}
            values={values}
            messages={t.SchemaForm}
            locale={eventLocale}
          />
        </SurveyEditor>
      </div>
    );
  }

  // Seeing without editing: the survey has started (canSeePractical), so it is closed, or the
  // viewer has withdrawn.
  let reason: string;
  if (viewer.user.status === UserStatus.WITHDRAWN) {
    reason = m.readOnly.withdrawn;
  } else if (!getPhase(viewer.settings, now).practicalOpen) {
    reason = m.readOnly.closed;
  } else {
    reason = m.readOnly.notEditable;
  }

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">
        {m.title}{" "}
        <span
          className={`badge align-middle fs-6 ${
            response.completed ? "text-bg-success" : "text-bg-secondary"
          }`}
        >
          {response.completed
            ? m.completion.completed
            : m.completion.notCompleted}
        </span>
      </h1>
      <p>{reason}</p>
      <p className="text-muted">{m.noEmail}</p>
      <SchemaFormResponse
        fields={fields}
        values={values}
        messages={t.SchemaForm}
      />
    </div>
  );
}

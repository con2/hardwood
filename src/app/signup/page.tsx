import { FormattedDateTime } from "@con2/components";
import type { ReactNode } from "react";

import { canEditSignup, hasAccepted } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { SurveyEditor } from "@/components/SurveyEditor";
import {
  SchemaForm,
  SchemaFormResponse,
  validateRequired,
  type Values,
} from "@/components/forms";
import { eventLocale, eventTimezone } from "@/config";
import { readSurvey } from "@/crypto/records";
import { getPhase } from "@/models/phase";
import { emptyVettingResponse } from "@/models/vetting";
import { SurveySlug, UserStatus } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { saveVettingAnswers, setVettingCompleted } from "./actions";

export default async function SignUpPage() {
  const viewer = await requireViewer();
  const t = getTranslations();
  const m = t.SignUp;

  // `/` sends signed-in users here, so redirecting there would loop.
  if (!hasAccepted(viewer)) {
    return (
      <div className="container mt-4 mb-4">
        <h1 className="mb-3">{m.title}</h1>
        <p className="text-muted">{m.notAccepted}</p>
      </div>
    );
  }

  const now = new Date();
  const fields = await readSurvey(SurveySlug.vetting, viewer.keys);
  const response = viewer.vettingResponse ?? emptyVettingResponse;
  const values = response.values as Values;
  const { signupStartsAt, signupEndsAt } = viewer.settings;

  const dateTime = (value: string) => (
    <FormattedDateTime
      value={value}
      locale={eventLocale}
      timezone={eventTimezone}
      includeWeekday
    />
  );

  if (fields.length === 0) {
    return (
      <div className="container mt-4 mb-4">
        <h1 className="mb-3">{m.title}</h1>
        <div className="alert alert-info">{m.noFields}</div>
      </div>
    );
  }

  if (canEditSignup(viewer, now)) {
    const fieldTitles = Object.fromEntries(
      fields.map((field) => [field.slug, field.title ?? field.slug]),
    );
    return (
      <div className="container mt-4 mb-4">
        <h1 className="mb-3">{m.title}</h1>
        <p>{m.intro}</p>
        {signupEndsAt ? (
          <p>
            {m.signupEndsAt} <strong>{dateTime(signupEndsAt)}</strong>.
          </p>
        ) : null}
        <p>{m.preview}</p>
        <SurveyEditor
          id="SignUp"
          saveAction={saveVettingAnswers}
          setCompletedAction={setVettingCompleted}
          fieldTitles={fieldTitles}
          initialCompleted={response.completed}
          initialMissing={validateRequired(fields, values)}
          locale={eventLocale}
          messages={{ Survey: m, Autosave: t.Autosave }}
          completionNote={m.onlyCompleted}
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

  let reason: ReactNode;
  if (viewer.user.status === UserStatus.WITHDRAWN) {
    reason = m.readOnly.withdrawn;
  } else if (!signupStartsAt) {
    reason = m.readOnly.notScheduled;
  } else if (!getPhase(viewer.settings, now).signupOpen) {
    reason =
      new Date(signupStartsAt) > now ? (
        <>
          {m.readOnly.notOpen} <strong>{dateTime(signupStartsAt)}</strong>.
        </>
      ) : (
        m.readOnly.closed
      );
  } else {
    reason = m.readOnly.notEntered;
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
      <SchemaFormResponse
        fields={fields}
        values={values}
        messages={t.SchemaForm}
      />
    </div>
  );
}

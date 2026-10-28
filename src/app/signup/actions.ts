"use server";

import { z } from "zod";

import {
  guardedSurveySave,
  surveyFormDataSchema,
} from "@/app/actions/surveyResponse";
import { requireViewer } from "@/auth/viewer";
import processFormData from "@/components/forms/processFormData";
import type { SurveySaveResult } from "@/components/SurveyEditor";
import {
  saveVettingAnswers as saveAnswers,
  setVettingCompleted as setCompleted,
} from "@/models/vetting";

/** Called by `AutosaveSchemaForm` with the whole Sign Up form. */
export async function saveVettingAnswers(
  formData: FormData,
): Promise<SurveySaveResult> {
  const viewer = await requireViewer();
  const input = surveyFormDataSchema.safeParse(formData);
  if (!input.success) return { ok: false };
  return guardedSurveySave("vetting response", () =>
    saveAnswers(
      viewer,
      (fields) => processFormData(fields, input.data),
      new Date(),
    ),
  );
}

export async function setVettingCompleted(
  completed: boolean,
): Promise<SurveySaveResult> {
  const viewer = await requireViewer();
  const input = z.boolean().safeParse(completed);
  if (!input.success) return { ok: false };
  return guardedSurveySave("vetting response", () =>
    setCompleted(viewer, input.data, new Date()),
  );
}

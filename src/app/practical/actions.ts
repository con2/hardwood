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
  savePracticalAnswers as saveAnswers,
  setPracticalCompleted as setCompleted,
} from "@/models/practical";

/** Called by `AutosaveSchemaForm` with the whole Practical form. */
export async function savePracticalAnswers(
  formData: FormData,
): Promise<SurveySaveResult> {
  const viewer = await requireViewer();
  const input = surveyFormDataSchema.safeParse(formData);
  if (!input.success) return { ok: false };
  return guardedSurveySave("practical response", () =>
    saveAnswers(
      viewer,
      (fields) => processFormData(fields, input.data),
      new Date(),
    ),
  );
}

export async function setPracticalCompleted(
  completed: boolean,
): Promise<SurveySaveResult> {
  const viewer = await requireViewer();
  const input = z.boolean().safeParse(completed);
  if (!input.success) return { ok: false };
  return guardedSurveySave("practical response", () =>
    setCompleted(viewer, input.data, new Date()),
  );
}

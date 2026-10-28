"use server";

import { z } from "zod";

import { requireViewer } from "@/auth/viewer";
import processFormData from "@/components/forms/processFormData";
import {
  Forbidden,
  saveVettingAnswers as saveAnswers,
  setVettingCompleted as setCompleted,
  type SavedVettingResponse,
} from "@/models/vetting";

export type SignUpSaveResult =
  | { ok: true; savedAt: string; completed: boolean; missing: string[] }
  | { ok: false; reason?: "forbidden" };

/** Generous: the whole survey as text, far above any sane response. */
const maxFormDataLength = 1_000_000;

const formDataSchema = z.instanceof(FormData).refine((formData) => {
  let length = 0;
  for (const [key, value] of formData.entries()) {
    if (typeof value !== "string") return false;
    length += key.length + value.length;
  }
  return length <= maxFormDataLength;
});

function ok({ response, missing }: SavedVettingResponse): SignUpSaveResult {
  return {
    ok: true,
    savedAt: new Date().toISOString(),
    completed: response.completed,
    missing,
  };
}

async function guarded(
  fn: () => Promise<SavedVettingResponse>,
): Promise<SignUpSaveResult> {
  try {
    return ok(await fn());
  } catch (error) {
    if (error instanceof Forbidden) return { ok: false, reason: "forbidden" };
    // Neither the payload nor the error details (which could quote it) are logged.
    console.error("Saving the vetting response failed");
    return { ok: false };
  }
}

/** Called by `AutosaveSchemaForm` with the whole Sign Up form. */
export async function saveVettingAnswers(
  formData: FormData,
): Promise<SignUpSaveResult> {
  const viewer = await requireViewer();
  const input = formDataSchema.safeParse(formData);
  if (!input.success) return { ok: false };
  return guarded(() =>
    saveAnswers(
      viewer,
      (fields) => processFormData(fields, input.data),
      new Date(),
    ),
  );
}

export async function setVettingCompleted(
  completed: boolean,
): Promise<SignUpSaveResult> {
  const viewer = await requireViewer();
  const input = z.boolean().safeParse(completed);
  if (!input.success) return { ok: false };
  return guarded(() => setCompleted(viewer, input.data, new Date()));
}

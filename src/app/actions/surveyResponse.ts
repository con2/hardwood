/**
 * Shared plumbing for the server actions that save the viewer's own survey response (Sign Up,
 * Practical). Not a server action module itself.
 */
import { z } from "zod";

import type { SurveySaveResult } from "@/components/SurveyEditor";
import { Forbidden } from "@/models/vetting";

/** Generous: the whole survey as text, far above any sane response. */
const maxFormDataLength = 1_000_000;

/** A `FormData` of string entries only, of bounded size. */
export const surveyFormDataSchema = z
  .instanceof(FormData)
  .refine((formData) => {
    let length = 0;
    for (const [key, value] of formData.entries()) {
      if (typeof value !== "string") return false;
      length += key.length + value.length;
    }
    return length <= maxFormDataLength;
  });

interface Saved {
  response: { completed: boolean };
  missing: string[];
}

/**
 * Runs a save and maps it to a `SurveySaveResult`: `Forbidden` to `reason: "forbidden"`,
 * anything else to a bare failure. `what` names the record in the log line; neither the payload
 * nor the error details (which could quote it) are logged.
 */
export async function guardedSurveySave(
  what: string,
  fn: () => Promise<Saved>,
): Promise<SurveySaveResult> {
  try {
    const { response, missing } = await fn();
    return {
      ok: true,
      savedAt: new Date().toISOString(),
      completed: response.completed,
      missing,
    };
  } catch (error) {
    if (error instanceof Forbidden) return { ok: false, reason: "forbidden" };
    console.error(`Saving the ${what} failed`);
    return { ok: false };
  }
}

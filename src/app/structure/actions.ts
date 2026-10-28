"use server";

import { refresh } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireGm } from "@/auth/viewer";
import { parseChoices } from "@/components/forms/editFieldForm";
import type { Field } from "@/components/forms/models";
import { choicesSchema, fieldsSchema } from "@/components/forms/schema";
import { eventTimezone } from "@/config";
import { writeEventSettings, writeSurvey } from "@/crypto/records";
import { setPrivacyPolicy } from "@/models/event";
import type { EventSettings } from "@/models/types";
import { SurveySlug } from "@/prisma/enums";

import {
  parseLocalDateTime,
  type TimelineKey,
  timelineKeys,
} from "./timeline/keys";

const surveySlugSchema = z.enum([SurveySlug.vetting, SurveySlug.practical]);

/** Bound to the survey slug by the page; called by `FormEditorWrapper` on every change. */
export async function updateSurveyFields(
  slug: SurveySlug,
  fields: Field[],
): Promise<{ ok: boolean }> {
  const viewer = await requireGm();
  const parsedSlug = surveySlugSchema.safeParse(slug);
  const parsedFields = fieldsSchema.safeParse(fields);
  if (!parsedSlug.success || !parsedFields.success) return { ok: false };

  await writeSurvey(parsedSlug.data, parsedFields.data, viewer.keys);
  // Re-render the page, e.g. the warning about missing magic fields.
  refresh();
  return { ok: true };
}

export interface ChoicesState {
  error?: "invalid";
  /** The submitted text, kept so that a failed save does not lose it. */
  characterGroups?: string;
  feeCategories?: string;
}

const choicesFormSchema = z.object({
  characterGroups: z.string().max(100_000),
  feeCategories: z.string().max(100_000),
});

export async function saveChoices(
  _prev: ChoicesState,
  formData: FormData,
): Promise<ChoicesState> {
  const viewer = await requireGm();
  const input = choicesFormSchema.safeParse({
    characterGroups: formData.get("characterGroups") ?? "",
    feeCategories: formData.get("feeCategories") ?? "",
  });
  if (!input.success) return { error: "invalid" };

  const characterGroups = choicesSchema.safeParse(
    parseChoices(input.data.characterGroups),
  );
  const feeCategories = choicesSchema.safeParse(
    parseChoices(input.data.feeCategories),
  );
  if (!characterGroups.success || !feeCategories.success) {
    return { error: "invalid", ...input.data };
  }

  const settings: EventSettings = {
    ...viewer.settings,
    characterGroups: characterGroups.data,
    feeCategories: feeCategories.data,
  };
  await writeEventSettings(settings, viewer.keys);
  redirect("/structure/choices?success=1");
}

const localDateTime = z
  .string()
  .regex(/^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(:\d{2})?)?$/);

export async function saveTimeline(formData: FormData): Promise<void> {
  const viewer = await requireGm();
  const timeline = {} as Record<TimelineKey, string | null>;
  for (const key of timelineKeys) {
    const value = localDateTime.safeParse(formData.get(key) ?? "");
    if (!value.success) redirect("/structure/timeline?error=invalid");
    try {
      timeline[key] = parseLocalDateTime(value.data, eventTimezone);
    } catch {
      redirect("/structure/timeline?error=invalid");
    }
  }

  await writeEventSettings({ ...viewer.settings, ...timeline }, viewer.keys);
  redirect("/structure/timeline?success=1");
}

const privacyPolicySchema = z.string().max(200_000);

export async function savePrivacyPolicy(formData: FormData): Promise<void> {
  await requireGm();
  const input = privacyPolicySchema.safeParse(
    formData.get("privacyPolicy") ?? "",
  );
  if (!input.success) redirect("/structure/privacy-policy?error=invalid");

  await setPrivacyPolicy(input.data);
  redirect("/structure/privacy-policy?success=1");
}

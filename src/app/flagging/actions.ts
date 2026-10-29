"use server";

import { z } from "zod";

import { requireViewer } from "@/auth/viewer";
import { choiceSlugPattern } from "@/components/forms/schema";
import { setFlag, setFlagsCompleted } from "@/models/flags";
import type { FlagSlug } from "@/models/types";
import { Forbidden } from "@/models/vetting";

export type FlaggingActionResult =
  { ok: true } | { ok: false; reason: "forbidden" | "invalid" | "generic" };

async function guarded(
  fn: () => Promise<unknown>,
): Promise<FlaggingActionResult> {
  try {
    await fn();
    return { ok: true };
  } catch (error) {
    if (error instanceof Forbidden) return { ok: false, reason: "forbidden" };
    // Neither the input nor the error details are logged.
    console.error("Saving flags failed");
    return { ok: false, reason: "generic" };
  }
}

const setFlagSchema = z.object({
  targetId: z.uuid(),
  // Whether the event defines the flag is checked by `setFlag`.
  choice: z.string().max(100).regex(choiceSlugPattern),
});

export async function setFlagAction(
  targetId: string,
  choice: FlagSlug,
): Promise<FlaggingActionResult> {
  const viewer = await requireViewer();
  const input = setFlagSchema.safeParse({ targetId, choice });
  if (!input.success) return { ok: false, reason: "invalid" };
  return guarded(() =>
    setFlag(viewer, input.data.targetId, input.data.choice, new Date()),
  );
}

export async function setFlagsCompletedAction(
  completed: boolean,
): Promise<FlaggingActionResult> {
  const viewer = await requireViewer();
  const input = z.boolean().safeParse(completed);
  if (!input.success) return { ok: false, reason: "invalid" };
  return guarded(() => setFlagsCompleted(viewer, input.data, new Date()));
}

"use server";

import { z } from "zod";

import { requireViewer } from "@/auth/viewer";
import { feedbackTextMaxLength, submitFeedback } from "@/models/feedback";
import { Forbidden } from "@/models/vetting";

export interface FeedbackState {
  status?: "sent" | "failed";
  /** The submitted input, kept so that a failed send does not lose it. */
  topic?: string;
  text?: string;
}

const feedbackFormSchema = z.object({
  topic: z.string().max(100),
  text: z.string().max(feedbackTextMaxLength * 2),
});

export async function sendFeedback(
  _prev: FeedbackState,
  formData: FormData,
): Promise<FeedbackState> {
  const viewer = await requireViewer();
  const input = feedbackFormSchema.safeParse({
    topic: formData.get("topic") ?? "",
    text: formData.get("text") ?? "",
  });
  if (!input.success) return { status: "failed" };

  try {
    await submitFeedback(
      viewer,
      { topic: input.data.topic || null, text: input.data.text },
      new Date(),
    );
  } catch (error) {
    if (error instanceof Forbidden) return { status: "failed", ...input.data };
    throw error;
  }
  return { status: "sent" };
}

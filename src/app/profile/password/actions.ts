"use server";

import { z } from "zod";

import { loadPasswordCheck, requiredScore } from "@/auth/passwordStrength";
import { hasAccepted } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { eventLocale } from "@/config";
import { createSession } from "@/crypto/session";
import { changePassword } from "@/models/user";

export interface ChangePasswordState {
  ok?: boolean;
  error?:
    | "wrongPassword"
    | "passwordsDiffer"
    | "passwordRequired"
    | "tooWeak"
    | "generic";
}

const schema = z.object({
  currentPassword: z.string().max(1024),
  newPassword: z.string().max(1024),
  confirmPassword: z.string().max(1024),
});

export async function changePasswordAction(
  _prev: ChangePasswordState,
  formData: FormData,
): Promise<ChangePasswordState> {
  const viewer = await requireViewer();
  if (!hasAccepted(viewer)) return { error: "generic" };

  const input = schema.safeParse({
    currentPassword: formData.get("currentPassword") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!input.success) return { error: "generic" };
  const { currentPassword, newPassword, confirmPassword } = input.data;
  if (!newPassword) return { error: "passwordRequired" };
  if (newPassword !== confirmPassword) return { error: "passwordsDiffer" };
  const check = await loadPasswordCheck(eventLocale);
  if (check(newPassword) < requiredScore(viewer.user.isGm)) {
    return { error: "tooWeak" };
  }

  const result = await changePassword(viewer, currentPassword, newPassword);
  if (!result.ok) return { error: result.reason };

  // Other sessions are void now; this one continues under the new epoch.
  await createSession({
    keys: viewer.keys,
    authenticatedAt: viewer.authenticatedAt,
    epoch: result.sessionEpoch,
  });
  return { ok: true };
}

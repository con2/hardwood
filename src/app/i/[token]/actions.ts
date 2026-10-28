"use server";

import { redirect } from "next/navigation";
import { z } from "zod";

import { getViewer } from "@/auth/viewer";
import { createSession } from "@/crypto/session";
import { acceptInvitation, signIn } from "@/models/user";

export interface SignInState {
  error?: "invalid" | "locked" | "revoked" | "generic";
}

const signInSchema = z.object({
  password: z.string().min(1).max(1024),
});

const tokenSchema = z.string().min(1).max(100);

export async function signInAction(
  token: string,
  _prev: SignInState,
  formData: FormData,
): Promise<SignInState> {
  const parsedToken = tokenSchema.safeParse(token);
  const input = signInSchema.safeParse({ password: formData.get("password") });
  if (!parsedToken.success || !input.success) return { error: "invalid" };

  const result = await signIn(parsedToken.data, input.data.password);
  if (!result.ok) return { error: result.reason };

  await createSession(result.keys);
  // Accept Invitation renders on the same URL when a password is pending.
  redirect(result.user.passwordPending ? `/i/${parsedToken.data}` : "/signup");
}

export interface AcceptInvitationState {
  error?: "passwordsDiffer" | "passwordRequired" | "generic";
}

const acceptSchema = z.object({
  name: z.string().max(200),
  newPassword: z.string().max(1024),
  confirmPassword: z.string().max(1024),
});

export async function acceptInvitationAction(
  _prev: AcceptInvitationState,
  formData: FormData,
): Promise<AcceptInvitationState> {
  const viewer = await getViewer();
  if (!viewer || !viewer.user.passwordPending) redirect("/");

  const input = acceptSchema.safeParse({
    name: formData.get("name") ?? "",
    newPassword: formData.get("newPassword") ?? "",
    confirmPassword: formData.get("confirmPassword") ?? "",
  });
  if (!input.success) return { error: "generic" };
  const { name, newPassword, confirmPassword } = input.data;
  if (!newPassword) return { error: "passwordRequired" };
  if (newPassword !== confirmPassword) return { error: "passwordsDiffer" };

  await acceptInvitation(viewer, { name, newPassword });
  // The private key is unchanged; re-issuing only refreshes the expiry.
  await createSession(viewer.keys);
  redirect("/signup");
}

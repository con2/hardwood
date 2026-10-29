"use server";

import { redirect } from "next/navigation";

import { getViewer } from "@/auth/viewer";
import { destroySession } from "@/crypto/session";
import { signOutEverywhere as invalidateSessions } from "@/models/user";

export async function signOut() {
  await destroySession();
  redirect("/");
}

export async function signOutEverywhere() {
  const viewer = await getViewer();
  if (viewer) await invalidateSessions(viewer.user.id);
  await destroySession();
  redirect("/");
}

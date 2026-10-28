"use server";

import { redirect } from "next/navigation";

import { destroySession } from "@/crypto/session";

export async function signOut() {
  await destroySession();
  redirect("/");
}

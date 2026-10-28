"use server";

import { redirect } from "next/navigation";

import { requireViewer } from "@/auth/viewer";
import { Forbidden } from "@/models/vetting";
import { withdraw } from "@/models/withdraw";

/**
 * Form action of the Withdraw confirmation (`ModalButton`) in the Danger Zone. On success the
 * user lands on Sign Up, where the WITHDRAWN banner and the read-only answers greet them.
 */
export async function withdrawAction(): Promise<void> {
  const viewer = await requireViewer();
  try {
    await withdraw(viewer.user.id);
  } catch (error) {
    if (!(error instanceof Forbidden)) {
      console.error("Withdrawing failed");
    }
    redirect("/privacy?error=withdraw");
  }
  redirect("/signup");
}

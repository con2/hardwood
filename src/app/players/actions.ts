"use server";

import { refresh, revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { requireGm } from "@/auth/viewer";
import { completeCasting, revertCasting } from "@/models/casting";
import {
  createInvites,
  deletePlayer,
  PlayerError,
  type PlayerErrorReason,
  playerAttributesPatchSchema,
  type PlayerAttributesPatch,
  resetPlayerPassword,
  setUiStatus,
  updatePlayerAttributes,
} from "@/models/players";
import {
  maxDiscordHandleLength,
  maxInvitesAtOnce,
  parseDiscordHandles,
  uiStatuses,
  type UiStatus,
} from "@/models/playerStatus";

export type PlayerActionResult =
  { ok: true } | { ok: false; reason: PlayerErrorReason | "generic" };

const userIdSchema = z.uuid();

/** Maps model errors to reasons; nothing about the input or the error is logged. */
async function guarded<T extends { ok: true }>(
  what: string,
  fn: () => Promise<T>,
): Promise<T | { ok: false; reason: PlayerErrorReason | "generic" }> {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof PlayerError)
      return { ok: false, reason: error.reason };
    console.error(`Players: ${what} failed`);
    return { ok: false, reason: "generic" };
  }
}

export async function setStatusAction(
  userId: string,
  status: UiStatus,
): Promise<PlayerActionResult> {
  const viewer = await requireGm();
  const input = z
    .object({ userId: userIdSchema, status: z.enum(uiStatuses) })
    .safeParse({ userId, status });
  if (!input.success) return { ok: false, reason: "invalid" };
  const result = await guarded("status change", async () => {
    await setUiStatus(input.data.userId, input.data.status, viewer.keys);
    return { ok: true as const };
  });
  // Re-render the table: the status select's options depend on the new status.
  if (result.ok) refresh();
  return result;
}

export async function updateAttributesAction(
  userId: string,
  patch: PlayerAttributesPatch,
): Promise<PlayerActionResult> {
  const viewer = await requireGm();
  const id = userIdSchema.safeParse(userId);
  const input = playerAttributesPatchSchema.safeParse(patch);
  if (!id.success || !input.success) return { ok: false, reason: "invalid" };
  return guarded("attribute update", async () => {
    await updatePlayerAttributes(id.data, input.data, viewer.keys);
    // No refresh: the cell already shows the value; a reload shows the server state.
    revalidatePath("/players");
    return { ok: true as const };
  });
}

export type ResetPasswordResult =
  | { ok: true; url: string; initialPassword: string }
  | { ok: false; reason: PlayerErrorReason | "generic" };

/** The new initial password goes back to this client only, for one-time display. */
export async function resetPasswordAction(
  userId: string,
): Promise<ResetPasswordResult> {
  const viewer = await requireGm();
  const id = userIdSchema.safeParse(userId);
  if (!id.success) return { ok: false, reason: "invalid" };
  return guarded("password reset", async () => ({
    ok: true as const,
    ...(await resetPlayerPassword(id.data, viewer.keys)),
  }));
}

/** Form action of the Delete confirmation (`ModalButton`). */
export async function deletePlayerAction(
  formData: FormData,
): Promise<PlayerActionResult> {
  const viewer = await requireGm();
  const id = userIdSchema.safeParse(formData.get("userId"));
  if (!id.success) return { ok: false, reason: "invalid" };
  const result = await guarded("deletion", async () => {
    await deletePlayer(id.data, viewer.keys);
    return { ok: true as const };
  });
  if (!result.ok) redirect(`/players?error=${result.reason}`);
  refresh();
  return result;
}

export async function completeCastingAction(): Promise<PlayerActionResult> {
  const viewer = await requireGm();
  const result = await guarded("casting completion", async () => {
    await completeCasting(viewer.keys, new Date());
    return { ok: true as const };
  });
  if (!result.ok) redirect(`/players?error=${result.reason}`);
  refresh();
  return result;
}

export async function revertCastingAction(): Promise<PlayerActionResult> {
  const viewer = await requireGm();
  const result = await guarded("casting revert", async () => {
    await revertCasting(viewer.keys);
    return { ok: true as const };
  });
  if (!result.ok) redirect(`/players?error=${result.reason}`);
  refresh();
  return result;
}

export type CreateInvitesState =
  | { status: "idle" }
  | {
      status: "created";
      invites: {
        discordHandle: string;
        url: string;
        initialPassword: string;
      }[];
    }
  | { status: "error"; reason: "empty" | "tooMany" | "failed"; text: string };

/**
 * The created invites, with their initial passwords, go back to the submitting client only
 * (`useActionState`); they are stored nowhere and never logged.
 */
export async function createInvitesAction(
  _prev: CreateInvitesState,
  formData: FormData,
): Promise<CreateInvitesState> {
  const viewer = await requireGm();
  const text = z
    .string()
    .max(maxInvitesAtOnce * (maxDiscordHandleLength + 2))
    .safeParse(formData.get("handles") ?? "");
  if (!text.success) return { status: "error", reason: "tooMany", text: "" };
  const handles = parseDiscordHandles(text.data);
  if (handles.length === 0) {
    return { status: "error", reason: "empty", text: text.data };
  }
  if (
    handles.length > maxInvitesAtOnce ||
    handles.some((handle) => handle.length > maxDiscordHandleLength)
  ) {
    return { status: "error", reason: "tooMany", text: text.data };
  }

  try {
    const invites = await createInvites(handles, viewer.keys);
    revalidatePath("/players");
    return {
      status: "created",
      invites: invites.map(({ discordHandle, url, initialPassword }) => ({
        discordHandle,
        url,
        initialPassword,
      })),
    };
  } catch {
    console.error("Players: creating invites failed");
    return { status: "error", reason: "failed", text: text.data };
  }
}

import type { CastingResult } from "@/models/types";
import { UserStatus } from "@/prisma/enums";
import type { Translations } from "@/translations";

interface Props {
  status: UserStatus;
  /** Only present once the casting is completed. */
  castingResult: CastingResult | null;
  messages: Translations["StatusBanner"];
}

export type StatusBannerKind = "withdrawn" | "selected" | "notSelected";

/**
 * Which banner to show, if any. WITHDRAWN takes precedence over a casting result (a withdrawn
 * player may still have a stale one); before casting completion there is no result to show.
 */
export function statusBannerKind(
  status: UserStatus,
  castingResult: Pick<CastingResult, "result"> | null,
): StatusBannerKind | null {
  if (status === UserStatus.WITHDRAWN) return "withdrawn";
  if (castingResult?.result === "SELECTED") return "selected";
  if (castingResult?.result === "NOT_SELECTED") return "notSelected";
  return null;
}

/**
 * Whether the banner carries the "no email" note, so that the page under it need not repeat it.
 * The casting result banners do; the WITHDRAWN one does not.
 */
export function bannerHasNoEmailNote(
  status: UserStatus,
  castingResult: Pick<CastingResult, "result"> | null,
): boolean {
  const kind = statusBannerKind(status, castingResult);
  return kind === "selected" || kind === "notSelected";
}

const variants: Record<StatusBannerKind, string> = {
  withdrawn: "secondary",
  selected: "success",
  notSelected: "info",
};

/**
 * Shown at the top of every view: the WITHDRAWN notice, or the casting result once the casting is
 * completed. Before that, selected and non-selected invitees look the same as everyone else.
 */
export function StatusBanner({ status, castingResult, messages }: Props) {
  const kind = statusBannerKind(status, castingResult);
  if (!kind) return null;
  return (
    <div className="container mt-4">
      <div className={`alert alert-${variants[kind]} mb-0`} role="status">
        {messages[kind]}
        {bannerHasNoEmailNote(status, castingResult) ? (
          <div className="small mt-1">{messages.noEmail}</div>
        ) : null}
      </div>
    </div>
  );
}

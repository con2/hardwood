import type { CastingResult } from "@/models/types";
import { UserStatus } from "@/prisma/enums";
import type { Translations } from "@/translations";

interface Props {
  status: UserStatus;
  /** Only present once the casting is completed. */
  castingResult: CastingResult | null;
  messages: Translations["StatusBanner"];
}

/**
 * Shown at the top of every view: the WITHDRAWN notice, or the casting result once the casting is
 * completed. Before that, selected and non-selected invitees look the same as everyone else.
 */
export function StatusBanner({ status, castingResult, messages }: Props) {
  let variant: string;
  let text: string;
  if (status === UserStatus.WITHDRAWN) {
    variant = "secondary";
    text = messages.withdrawn;
  } else if (castingResult?.result === "SELECTED") {
    variant = "success";
    text = messages.selected;
  } else if (castingResult?.result === "NOT_SELECTED") {
    variant = "info";
    text = messages.notSelected;
  } else {
    return null;
  }

  return (
    <div className="container mt-4">
      <div className={`alert alert-${variant} mb-0`} role="status">
        {text}
      </div>
    </div>
  );
}

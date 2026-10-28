import Link from "next/link";

import type { FlagColour, FlagMatrixUser } from "@/models/flags";
import type { Translations } from "@/translations";

export const colourVariants: Record<FlagColour, string> = {
  RED: "danger",
  YELLOW: "warning",
  GREEN: "success",
};

export function ColourBadge({
  colour,
  messages,
}: {
  colour: FlagColour;
  messages: Translations["Flags"];
}) {
  return (
    <span className={`badge text-bg-${colourVariants[colour]}`}>
      {messages.colours[colour]}
    </span>
  );
}

/** A person's name linking to their flags, muted with a badge if withdrawn. */
export function PersonLink({
  user,
  withdrawnLabel,
}: {
  user: FlagMatrixUser;
  withdrawnLabel: string;
}) {
  return (
    <>
      <Link
        href={`/players/flags/${user.userId}`}
        className={user.withdrawn ? "link-secondary" : undefined}
      >
        {user.name}
      </Link>
      {user.withdrawn ? (
        <span className="badge text-bg-secondary ms-2">{withdrawnLabel}</span>
      ) : null}
    </>
  );
}

export function SensitiveWarning({ message }: { message: string }) {
  return (
    <div className="alert alert-warning" role="alert">
      {message}
    </div>
  );
}

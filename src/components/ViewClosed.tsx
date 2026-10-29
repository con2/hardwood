import { FormattedDateTime } from "@con2/components";
import type { ReactNode } from "react";

import { eventLocale, eventTimezone } from "@/config";

export interface Opening {
  /** ISO timestamp, or null while unscheduled. */
  at: string | null;
  /** Followed by the time and a full stop. */
  opensAt: string;
  notScheduled: string;
}

interface Props {
  title: string;
  reason: string;
  /** Given only when waiting for the view to open would make it accessible. */
  opening?: Opening;
  children?: ReactNode;
}

/** A main view the viewer cannot open (yet): why not and, if it is a matter of time, when. */
export function ViewClosed({ title, reason, opening, children }: Props) {
  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{title}</h1>
      <div className="alert alert-info">
        {reason}
        {opening ? (
          opening.at ? (
            <>
              {" "}
              {opening.opensAt}{" "}
              <strong>
                <FormattedDateTime
                  value={opening.at}
                  locale={eventLocale}
                  timezone={eventTimezone}
                  includeWeekday
                />
              </strong>
              .
            </>
          ) : (
            <> {opening.notScheduled}</>
          )
        ) : null}
      </div>
      {children}
    </div>
  );
}

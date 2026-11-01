import Link from "next/link";

import type { FlagMatrixUser } from "@/models/flags";
import { flagFilters, type FlagFilter } from "@/models/flagSummary";
import type { Translations } from "@/translations";

/** `path` with the filter as a query parameter, so that links between the flag views keep it. */
export function withFilter(path: string, filter: FlagFilter): string {
  return filter === "all" ? path : `${path}?filter=${filter}`;
}

/** A person's name linking to their flags, muted with a badge if withdrawn. */
export function PersonLink({
  user,
  withdrawnLabel,
  filter,
}: {
  user: FlagMatrixUser;
  withdrawnLabel: string;
  filter: FlagFilter;
}) {
  return (
    <>
      <Link
        href={withFilter(`/players/flags/${user.userId}`, filter)}
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

export function FlagFilterNav({
  path,
  filter,
  messages,
}: {
  path: string;
  filter: FlagFilter;
  messages: Translations["Flags"]["filters"];
}) {
  return (
    <div
      className="btn-group flex-wrap mb-3"
      role="group"
      aria-label={messages.label}
    >
      {flagFilters.map((option) => (
        <Link
          key={option}
          href={withFilter(path, option)}
          className={`btn btn-outline-secondary ${option === filter ? "active" : ""}`}
          aria-current={option === filter ? "page" : undefined}
        >
          {messages[option]}
        </Link>
      ))}
    </div>
  );
}

export function SensitiveWarning({ message }: { message: string }) {
  return (
    <div className="alert alert-warning" role="alert">
      {message}
    </div>
  );
}

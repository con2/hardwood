import { notFound } from "next/navigation";

import { flaggingMode } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { getTranslations } from "@/translations";

/** Placeholder: the Flagging view comes in M5. */
export default async function FlaggingPage() {
  const viewer = await requireViewer();
  if (flaggingMode(viewer, new Date()) === "none") notFound();
  const t = getTranslations();

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{t.AppBar.flagging}</h1>
      <p className="text-muted">{t.ComingSoon.flagging}</p>
    </div>
  );
}

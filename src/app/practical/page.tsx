import { notFound } from "next/navigation";

import { canSeePractical } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { getTranslations } from "@/translations";

/** Placeholder: the Practical view comes in M6. */
export default async function PracticalPage() {
  const viewer = await requireViewer();
  if (!canSeePractical(viewer, new Date())) notFound();
  const t = getTranslations();

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{t.AppBar.practical}</h1>
      <p className="text-muted">{t.ComingSoon.practical}</p>
    </div>
  );
}

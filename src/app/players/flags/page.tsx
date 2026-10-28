import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { getTranslations } from "@/translations";

/** Placeholder: the flags matrix comes in M5. */
export default async function FlagsPage() {
  await requireGm();
  const m = getTranslations().Players;
  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{m.flagsPage.title}</h1>
      <p>{m.flagsPage.comingSoon}</p>
      <Link href="/players">{m.invite.back}</Link>
    </div>
  );
}

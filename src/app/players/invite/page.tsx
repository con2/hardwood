import Link from "next/link";

import { requireGm } from "@/auth/viewer";
import { getTranslations } from "@/translations";

import { InviteForm } from "./InviteForm";

export default async function InvitePage() {
  await requireGm();
  const m = getTranslations().Players.invite;
  return (
    <div className="container mt-4 mb-4">
      <p>
        <Link href="/players">{m.back}</Link>
      </p>
      <h1 className="mb-3">{m.title}</h1>
      <p>{m.intro}</p>
      <InviteForm messages={m} />
    </div>
  );
}

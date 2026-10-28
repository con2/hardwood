import { redirect } from "next/navigation";

import { requireGm } from "@/auth/viewer";

export default async function StructurePage() {
  await requireGm();
  redirect("/structure/vetting");
}

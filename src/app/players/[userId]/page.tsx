import { redirect } from "next/navigation";

import { readUserId } from "./PlayerView";

/** The Sign-up tab, not Flags: the spec wants the flags opened only on purpose. */
export default async function PlayerPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const userId = await readUserId(params);
  redirect(`/players/${userId}/vetting`);
}

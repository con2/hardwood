import { redirect } from "next/navigation";
import { connection } from "next/server";

import { getViewer } from "@/auth/viewer";
import { larpitUrl } from "@/config";

/** Signed-out visitors see nothing here: they are sent to the larp's page on larpit.fi. */
export default async function HomePage() {
  await connection();
  const viewer = await getViewer();
  redirect(viewer ? "/signup" : larpitUrl);
}

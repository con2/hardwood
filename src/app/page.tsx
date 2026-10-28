import { redirect } from "next/navigation";
import { connection } from "next/server";

import { larpitUrl } from "@/config";

/** Signed-out visitors see nothing here: they are sent to the larp's page on larpit.fi. */
export default async function HomePage() {
  await connection();
  redirect(larpitUrl);
}

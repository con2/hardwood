import { db } from "@/prisma/db";

/** The privacy policy is plaintext Markdown by design: INVITED users read it before accepting. */
export async function getPrivacyPolicy(): Promise<string> {
  const event = await db.orm.public.Event.select("privacyPolicy").first({
    id: 1,
  });
  return event?.privacyPolicy ?? "";
}

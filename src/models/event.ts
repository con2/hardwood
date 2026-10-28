import { db } from "@/prisma/db";

/** The privacy policy is plaintext Markdown by design: INVITED users read it before accepting. */
export async function getPrivacyPolicy(): Promise<string> {
  const event = await db.orm.public.Event.select("privacyPolicy").first({
    id: 1,
  });
  return event?.privacyPolicy ?? "";
}

/** GM only (the caller checks). Stored in plaintext, see `getPrivacyPolicy`. */
export async function setPrivacyPolicy(markdown: string): Promise<void> {
  await db.orm.public.Event.where({ id: 1 }).update({
    privacyPolicy: markdown,
  });
}

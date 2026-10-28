import { requireGm } from "@/auth/viewer";
import { SurveySlug } from "@/prisma/enums";

import { SurveyEditor } from "../SurveyEditor";

export default async function VettingSurveyPage() {
  const viewer = await requireGm();
  return <SurveyEditor viewer={viewer} slug={SurveySlug.vetting} />;
}

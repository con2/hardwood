import { requireGm } from "@/auth/viewer";
import { SurveySlug } from "@/prisma/enums";

import { SurveyEditor } from "../SurveyEditor";

export default async function PracticalSurveyPage() {
  const viewer = await requireGm();
  return <SurveyEditor viewer={viewer} slug={SurveySlug.practical} />;
}

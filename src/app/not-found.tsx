import { ErrorMessage } from "@/components/ErrorMessage";
import { getTranslations } from "@/translations";

export default function NotFound() {
  const t = getTranslations();
  return <ErrorMessage>{t.Errors.notFound}</ErrorMessage>;
}

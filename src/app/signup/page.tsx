import { hasAccepted } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { getTranslations } from "@/translations";

/** Placeholder: the Sign Up view comes in M3. */
export default async function SignUpPage() {
  const viewer = await requireViewer();
  const t = getTranslations();

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{t.SignUp.title}</h1>
      <p className="text-muted">
        {hasAccepted(viewer) ? t.SignUp.placeholder : t.SignUp.notAccepted}
      </p>
    </div>
  );
}

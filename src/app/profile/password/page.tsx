import { redirect } from "next/navigation";

import { requiredScore } from "@/auth/passwordStrength";
import { hasAccepted } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { eventLocale } from "@/config";
import { getTranslations } from "@/translations";

import { ChangePasswordForm } from "./ChangePasswordForm";

export default async function ChangePasswordPage() {
  const viewer = await requireViewer();
  if (!hasAccepted(viewer)) redirect("/");
  const t = getTranslations();

  return (
    <div className="container mt-4 mb-4" style={{ maxWidth: "40rem" }}>
      <h1 className="mb-3">{t.ChangePassword.title}</h1>
      <ChangePasswordForm
        locale={eventLocale}
        requiredScore={requiredScore(viewer.user.isGm)}
        messages={t.ChangePassword}
        strengthMessages={t.PasswordStrength}
      />
    </div>
  );
}

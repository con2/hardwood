import { Markdown } from "@con2/components";

import { requireViewer } from "@/auth/viewer";
import { getPrivacyPolicy } from "@/models/event";
import { getTranslations } from "@/translations";

/** Readable by every signed-in user, including INVITED ones deciding whether to accept. */
export default async function PrivacyPage() {
  await requireViewer();
  const t = getTranslations();
  const privacyPolicy = await getPrivacyPolicy();

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{t.Privacy.title}</h1>
      {privacyPolicy.trim() ? (
        <Markdown input={privacyPolicy} />
      ) : (
        <p className="text-muted">{t.Privacy.empty}</p>
      )}
      {/* TODO(M6): Danger Zone with the Withdraw button, for accepted invitees only (hasAccepted). */}
    </div>
  );
}

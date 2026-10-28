import { Markdown, MarkdownEditor, SubmitButton } from "@con2/components";

import { requireGm } from "@/auth/viewer";
import { eventLocale } from "@/config";
import { getPrivacyPolicy } from "@/models/event";
import { getTranslations } from "@/translations";

import { savePrivacyPolicy } from "../actions";
import { readStatus, StructureView } from "../StructureView";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function PrivacyPolicyPage({ searchParams }: Props) {
  await requireGm();
  const t = getTranslations();
  const m = t.Structure;
  const { saved, error } = await readStatus(searchParams);
  const privacyPolicy = await getPrivacyPolicy();

  return (
    <StructureView
      active="privacyPolicy"
      messages={m}
      saved={saved}
      error={error}
    >
      <p>{m.privacyPolicy.intro}</p>
      <form action={savePrivacyPolicy} className="mb-4">
        <div className="mb-3">
          <label htmlFor="PrivacyPolicy-editor" className="form-label fw-bold">
            {m.privacyPolicy.editor}
          </label>
          <MarkdownEditor
            id="PrivacyPolicy-editor"
            name="privacyPolicy"
            defaultValue={privacyPolicy}
            rows={20}
            locale={eventLocale}
          />
        </div>
        <SubmitButton>{t.common.actions.save}</SubmitButton>
      </form>
      <h2 className="h4">{m.privacyPolicy.preview}</h2>
      <div className="border rounded p-3">
        {privacyPolicy.trim() ? (
          <Markdown input={privacyPolicy} />
        ) : (
          <p className="text-muted mb-0">{m.privacyPolicy.empty}</p>
        )}
      </div>
    </StructureView>
  );
}

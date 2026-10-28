import { Markdown } from "@con2/components";

import type { Viewer } from "@/auth/viewer";
import FormEditorWrapper from "@/components/forms/FormEditorWrapper";
import { magicSlugs } from "@/components/forms/models";
import { eventLocale } from "@/config";
import { readSurvey } from "@/crypto/records";
import { SurveySlug } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { updateSurveyFields } from "./actions";
import { StructureView } from "./StructureView";

/** The vetting and practical survey tabs. */
export async function SurveyEditor({
  viewer,
  slug,
}: {
  viewer: Viewer;
  slug: SurveySlug;
}) {
  const t = getTranslations();
  const m = t.Structure;
  const fields = await readSurvey(slug, viewer.keys);

  const isVetting = slug === SurveySlug.vetting;
  const missingMagicSlugs = isVetting
    ? Object.values(magicSlugs).filter(
        (magicSlug) => !fields.some((field) => field.slug === magicSlug),
      )
    : [];

  return (
    <StructureView active={slug} messages={m}>
      <p>{isVetting ? m.vetting.intro : m.practical.intro}</p>
      {isVetting ? (
        <>
          {missingMagicSlugs.length ? (
            <div className="alert alert-warning" role="alert">
              <p>{m.vetting.missingMagicFields}</p>
              <ul className="mb-0">
                {missingMagicSlugs.map((magicSlug) => (
                  <li key={magicSlug}>
                    <code>{magicSlug}</code>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div className="alert alert-info">
            <h2 className="h6">{m.vetting.magicFieldsTitle}</h2>
            <div className="mb-n3">
              <Markdown input={m.vetting.magicFields} />
            </div>
          </div>
        </>
      ) : null}
      <FormEditorWrapper
        initialFields={fields}
        locale={eventLocale}
        messages={{ FormEditor: t.FormEditor, SchemaForm: t.SchemaForm }}
        onChange={updateSurveyFields.bind(null, slug)}
      />
    </StructureView>
  );
}

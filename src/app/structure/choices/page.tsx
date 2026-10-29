import { Markdown } from "@con2/components";

import { requireGm } from "@/auth/viewer";
import { formatChoices } from "@/components/forms/editFieldForm";
import { formatFlagDefinitions } from "@/models/flagDefinitions";
import { getTranslations } from "@/translations";

import { readStatus, StructureView } from "../StructureView";
import { ChoicesForm } from "./ChoicesForm";

interface Props {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export default async function ChoicesPage({ searchParams }: Props) {
  const viewer = await requireGm();
  const t = getTranslations();
  const m = t.Structure;
  const { saved } = await readStatus(searchParams);

  return (
    <StructureView active="choices" messages={m} saved={saved}>
      <Markdown input={m.choices.intro} />
      <ChoicesForm
        characterGroups={formatChoices(viewer.settings.characterGroups)}
        feeCategories={formatChoices(viewer.settings.feeCategories)}
        flags={formatFlagDefinitions(viewer.settings.flags)}
        messages={m}
        saveLabel={t.common.actions.save}
      />
    </StructureView>
  );
}

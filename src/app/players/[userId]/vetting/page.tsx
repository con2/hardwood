import { notFound } from "next/navigation";

import { requireGm } from "@/auth/viewer";
import { SchemaFormResponse, type Values } from "@/components/forms";
import { readSurvey } from "@/crypto/records";
import { parseFlagFilter } from "@/models/flagSummary";
import { readPlayerDetail } from "@/models/responses";
import { SurveySlug } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { PlayerView, readUserId } from "../PlayerView";

/** A player's vetting response, shown only once they have marked it completed. */
export default async function PlayerVettingPage({
  params,
  searchParams,
}: {
  params: Promise<{ userId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireGm();
  const userId = await readUserId(params);
  const filter = parseFlagFilter((await searchParams).filter);
  const [detail, fields] = await Promise.all([
    readPlayerDetail(viewer.keys, userId),
    readSurvey(SurveySlug.vetting, viewer.keys),
  ]);
  if (!detail) notFound();

  const t = getTranslations();
  const m = t.PlayerDetail;
  const { state, response } = detail.vetting;

  return (
    <PlayerView
      person={detail.person}
      active="vetting"
      filter={filter}
      messages={m}
      statusLabels={t.UserStatus}
    >
      {response ? (
        <SchemaFormResponse
          fields={fields}
          values={response.values as Values}
          messages={t.SchemaForm}
        />
      ) : (
        <p className="text-muted">
          {state === "none" ? m.vetting.none : m.vetting.inProgress}
        </p>
      )}
    </PlayerView>
  );
}

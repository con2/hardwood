import { notFound } from "next/navigation";

import { requireGm } from "@/auth/viewer";
import { SchemaFormResponse, type Values } from "@/components/forms";
import { readSurvey } from "@/crypto/records";
import { parseFlagFilter } from "@/models/flagSummary";
import { readPlayerDetail } from "@/models/responses";
import { SurveySlug } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { PlayerView, readUserId } from "../PlayerView";

/** A player's practical response, whether marked completed or not. */
export default async function PlayerPracticalPage({
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
    readSurvey(SurveySlug.practical, viewer.keys),
  ]);
  if (!detail) notFound();

  const t = getTranslations();
  const m = t.PlayerDetail;
  const { response } = detail.practical;

  return (
    <PlayerView
      person={detail.person}
      active="practical"
      filter={filter}
      messages={m}
      statusLabels={t.UserStatus}
    >
      {response ? (
        <>
          <p>
            {response.completed ? (
              <span className="badge text-bg-success">
                {m.practical.completed}
              </span>
            ) : (
              <span className="badge text-bg-warning">
                {m.practical.inProgress}
              </span>
            )}
          </p>
          <SchemaFormResponse
            fields={fields}
            values={response.values as Values}
            messages={t.SchemaForm}
          />
        </>
      ) : (
        <p className="text-muted">{m.practical.none}</p>
      )}
    </PlayerView>
  );
}

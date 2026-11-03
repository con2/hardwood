import Link from "next/link";
import { notFound } from "next/navigation";

import { requireGm } from "@/auth/viewer";
import { parseFlagFilter } from "@/models/flagSummary";
import { surveySummary } from "@/models/responses";
import { SurveySlug } from "@/prisma/enums";
import { getTranslations } from "@/translations";

import { FlagFilterNav } from "../../flags/components";
import { FieldSummaryTable } from "../FieldSummaryTable";

function parseSurveySlug(value: string): SurveySlug | null {
  return (Object.values(SurveySlug) as string[]).includes(value)
    ? (value as SurveySlug)
    : null;
}

/** GM only: answer counts of the choice fields of the vetting or practical survey. */
export default async function SurveySummaryPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const viewer = await requireGm();
  const slug = parseSurveySlug((await params).slug);
  if (!slug) notFound();
  const filter = parseFlagFilter((await searchParams).filter);
  const { countPeople, countResponses, summaries } = await surveySummary(
    viewer.keys,
    slug,
    filter,
  );

  const t = getTranslations();
  const m = t.Summary;

  return (
    <div className="container mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h1 className="mb-0 me-auto">{m.title[slug]}</h1>
        <Link href="/players" className="btn btn-outline-secondary">
          {m.backToPlayers}
        </Link>
      </div>
      <p className="text-muted">{m.intro}</p>
      <FlagFilterNav
        path={`/players/summary/${slug}`}
        filter={filter}
        messages={t.Flags.filters}
      />
      <p>{m.countResponses[slug](countResponses, countPeople)}</p>

      {summaries.length === 0 ? (
        <div className="alert alert-info">{m.noChoiceFields}</div>
      ) : (
        summaries.map((summary) => (
          <section key={summary.field.slug} className="mb-4">
            <h2 className="h4">{summary.field.title || summary.field.slug}</h2>
            <FieldSummaryTable summary={summary} messages={m} />
          </section>
        ))
      )}
    </div>
  );
}

import type { Choice } from "@/components/forms/models";
import type { FieldSummary } from "@/models/responseSummary";
import type { Translations } from "@/translations";

type Messages = Translations["Summary"];

function ChoiceCountsTable({
  choices,
  counts,
  countResponses,
  countMissing,
  messages,
}: {
  choices: Choice[];
  counts: Record<string, number>;
  /** The base of the percentages: responses with an answer. */
  countResponses: number;
  countMissing: number;
  messages: Messages;
}) {
  return (
    <table className="table table-striped table-bordered">
      <thead>
        <tr>
          <th scope="col">{messages.columns.choice}</th>
          <th scope="col">{messages.columns.share}</th>
          <th scope="col">{messages.columns.count}</th>
        </tr>
      </thead>
      <tbody>
        {Object.entries(counts).map(([slug, count]) => {
          const choice = choices.find((c) => c.slug === slug);
          const percentage = countResponses
            ? Math.round((count / countResponses) * 100)
            : 0;
          return (
            <tr key={slug}>
              <th scope="row" className="align-middle fw-normal">
                {choice ? (
                  choice.title
                ) : (
                  <>
                    <span title={messages.choiceRemoved}>⚠️</span>{" "}
                    <em>{slug}</em>
                  </>
                )}
              </th>
              <td className="align-middle" style={{ width: "30%" }}>
                <div
                  className="progress"
                  role="progressbar"
                  aria-valuenow={percentage}
                  aria-valuemin={0}
                  aria-valuemax={100}
                >
                  <div
                    className="progress-bar"
                    style={{ width: `${percentage}%` }}
                  >
                    {percentage}%
                  </div>
                </div>
              </td>
              <td className="align-middle" style={{ width: "10%" }}>
                {count}
              </td>
            </tr>
          );
        })}
        <tr>
          <th scope="row" className="fw-normal">
            <em className="text-muted">{messages.noAnswer}</em>
          </th>
          <td></td>
          <td>
            <span className="text-muted">{countMissing}</span>
          </td>
        </tr>
      </tbody>
    </table>
  );
}

/** Answer counts of one choice field; a RadioMatrix gets a table per question. */
export function FieldSummaryTable({
  summary,
  messages,
}: {
  summary: FieldSummary;
  messages: Messages;
}) {
  if (summary.type === "Select") {
    return (
      <ChoiceCountsTable
        choices={summary.field.choices}
        counts={summary.counts}
        countResponses={summary.countResponses}
        countMissing={summary.countMissing}
        messages={messages}
      />
    );
  }

  const { field, countTotal, questions } = summary;
  return (
    <>
      {field.questions.map((question) => {
        const { counts, countMissing } = questions[question.slug];
        return (
          <section key={question.slug}>
            <h3 className="h6">{question.title}</h3>
            <ChoiceCountsTable
              choices={field.choices}
              counts={counts}
              countResponses={countTotal - countMissing}
              countMissing={countMissing}
              messages={messages}
            />
          </section>
        );
      })}
    </>
  );
}

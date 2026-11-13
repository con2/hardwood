import { requireGm } from "@/auth/viewer";
import { eventLocale } from "@/config";
import { listFeedback } from "@/models/feedback";
import { topicTitle } from "@/models/feedbackEntries";
import { getTranslations } from "@/translations";

function formatDay(day: string): string {
  // A calendar day, not an instant: formatted at noon UTC, it reads the same in any time zone.
  return new Intl.DateTimeFormat(eventLocale, {
    dateStyle: "full",
    timeZone: "UTC",
  }).format(new Date(`${day}T12:00:00Z`));
}

export default async function ReceivedFeedbackPage() {
  const viewer = await requireGm();
  const m = getTranslations().Feedback.received;
  const entries = await listFeedback(viewer.keys);
  const topics = viewer.settings.feedbackTopics;

  return (
    <div className="container mt-4 mb-4">
      <h1 className="mb-3">{m.title}</h1>
      <p>{m.intro}</p>
      {entries.length === 0 ? (
        <p className="text-muted">{m.empty}</p>
      ) : (
        entries.map((entry) => (
          <div className="card mb-3" key={entry.id}>
            <div className="card-header d-flex flex-wrap gap-2 align-items-center">
              <strong className="me-auto">
                {topicTitle(entry.topic, topics) ?? (
                  <em className="text-muted">{m.noTopic}</em>
                )}
              </strong>
              <span className="text-muted">{formatDay(entry.submittedOn)}</span>
            </div>
            <div className="card-body" style={{ whiteSpace: "pre-wrap" }}>
              {entry.text}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

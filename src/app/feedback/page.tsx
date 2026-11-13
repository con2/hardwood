import { Markdown } from "@con2/components";
import Link from "next/link";
import { notFound } from "next/navigation";

import { canGiveFeedback } from "@/auth/permissions";
import { requireViewer } from "@/auth/viewer";
import { feedbackTextMaxLength } from "@/models/feedback";
import { getTranslations } from "@/translations";

import { FeedbackForm } from "./FeedbackForm";

export default async function FeedbackPage() {
  const viewer = await requireViewer();
  if (!canGiveFeedback(viewer)) notFound();
  const m = getTranslations().Feedback;
  const showReceived = viewer.user.isGm && !!viewer.keys.gmKey;

  return (
    <div className="container mt-4 mb-4">
      <div className="d-flex flex-wrap gap-2 align-items-center mb-3">
        <h1 className="mb-0 me-auto">{m.title}</h1>
        {showReceived ? (
          <Link href="/feedback/received" className="btn btn-outline-primary">
            {m.received.link}
          </Link>
        ) : null}
      </div>
      <Markdown input={m.intro} />
      <FeedbackForm
        topics={viewer.settings.feedbackTopics}
        maxLength={feedbackTextMaxLength}
        messages={m}
      />
    </div>
  );
}

"use client";

import { SubmitButton } from "@con2/components";
import { useActionState } from "react";

import type { Choice } from "@/models/types";
import type { Translations } from "@/translations";

import { type FeedbackState, sendFeedback } from "./actions";

interface Props {
  topics: Choice[];
  maxLength: number;
  messages: Translations["Feedback"];
}

export function FeedbackForm({ topics, maxLength, messages }: Props) {
  const [state, action] = useActionState<FeedbackState, FormData>(
    sendFeedback,
    {},
  );

  return (
    // The key re-mounts the inputs: emptied after sending, refilled after a failure.
    <form action={action} key={JSON.stringify(state)}>
      {state.status === "sent" ? (
        <div className="alert alert-success" role="status">
          {messages.sent}
        </div>
      ) : null}
      {state.status === "failed" ? (
        <div className="alert alert-danger" role="alert">
          {messages.failed}
        </div>
      ) : null}
      {topics.length > 0 ? (
        <div className="mb-3">
          <label htmlFor="Feedback-topic" className="form-label fw-bold">
            {messages.topic}
          </label>
          <select
            id="Feedback-topic"
            name="topic"
            className="form-select"
            required
            defaultValue={state.topic ?? ""}
          >
            <option value="" disabled>
              {messages.chooseTopic}
            </option>
            {topics.map((topic) => (
              <option key={topic.slug} value={topic.slug}>
                {topic.title}
              </option>
            ))}
          </select>
        </div>
      ) : null}
      <div className="mb-3">
        <label htmlFor="Feedback-text" className="form-label fw-bold">
          {messages.text}
        </label>
        <textarea
          id="Feedback-text"
          name="text"
          className="form-control"
          rows={10}
          required
          maxLength={maxLength}
          defaultValue={state.text ?? ""}
        />
      </div>
      <SubmitButton>{messages.submit}</SubmitButton>
    </form>
  );
}

"use client";

import { useState } from "react";
import { createSubmission } from "../lib/api-client";
import type { Submission } from "../lib/types/assignment";
import { Button } from "./atoms/button";
import { TextArea } from "./atoms/text-area";

type Props = {
  assignmentId: string;
  onSubmitted: (submission: Submission) => void;
};

export function SubmissionForm({ assignmentId, onSubmitted }: Props) {
  const [content, setContent] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const trimmed = content.trim();
  const canSubmit = trimmed.length > 0 && !pending;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;
    setPending(true);
    setError(null);
    try {
      const result = await createSubmission(assignmentId, { content });
      setContent("");
      onSubmitted(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={submit} className="submission-form">
      <TextArea
        name="content"
        label="Your answer"
        value={content}
        onChange={setContent}
        rows={8}
        maxLength={200_000}
        placeholder="Write your work here."
        disabled={pending}
        spellCheck
      />
      <div className="form-footer">
        <Button variant="primary" type="submit" disabled={!canSubmit} loading={pending}>
          SUBMIT
        </Button>
      </div>
      {error ? (
        <div className="banner banner--error" role="alert">
          <span className="banner__body">{error}</span>
        </div>
      ) : null}
    </form>
  );
}

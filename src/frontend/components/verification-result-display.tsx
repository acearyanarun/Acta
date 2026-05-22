import type {
  ConceptCheckQuestion,
  ConceptCheckVerification,
  VerificationAnswer,
} from "../lib/types/assignment";
import { VERIFICATION_RESULT_LABELS } from "../lib/types/assignment";

type Props = {
  attempt: ConceptCheckVerification;
  questions: ConceptCheckQuestion[];
  /** When true, render the student's raw answer text alongside per-question feedback. */
  showAnswers: boolean;
  /** When true (instructor view), render the reference-pin indicator if present. */
  showReferencePin?: boolean;
};

const STATUS_LABEL: Record<"sufficient" | "partial" | "insufficient", string> = {
  sufficient: "Sufficient",
  partial: "Partial",
  insufficient: "Insufficient",
};

export function VerificationResultDisplay({
  attempt,
  questions,
  showAnswers,
  showReferencePin = false,
}: Props) {
  const byQuestionId = new Map<string, VerificationAnswer>(
    attempt.answers.map((a) => [a.questionId, a]),
  );
  // Sprint B: strengthen result badge (size + color via .verification-badge--lg).
  // Subtitle "Verification signal — for instructor review. Not a final grade." dropped:
  // the badge + evidence-report disclaimer already cover that framing.
  const sufficientCount = attempt.perQuestionFeedback.filter(
    (f) => f.status === "sufficient",
  ).length;
  const totalCount = attempt.perQuestionFeedback.length;
  return (
    <div className="placeholder-card verification-card">
      <div className="verification-card__header">
        <span
          className={`verification-badge verification-badge--lg verification-badge--${attempt.result}`}
        >
          {VERIFICATION_RESULT_LABELS[attempt.result]}
        </span>
        <span className="verification-card__counts">
          {sufficientCount} of {totalCount} sufficient
        </span>
        <span style={{ color: "var(--muted)" }}>
          evaluated {new Date(attempt.evaluatedAt).toLocaleString()} ·{" "}
          {attempt.model ?? attempt.provider}
        </span>
        {/* Instructor-only reference-pin indicator (D-041). Hidden from students. */}
        {showReferencePin && attempt.referenceVersion != null ? (
          <span
            className="placeholder-tag reference-pin-tag"
            title={attempt.referenceHash ?? undefined}
          >
            Evaluated against Instructor Solution Guide v{attempt.referenceVersion}
          </span>
        ) : null}
      </div>
      <p className="verification-card__overall">{attempt.overallFeedback}</p>
      <ol className="verification-card__feedback-list">
        {questions.map((q) => {
          const fb = attempt.perQuestionFeedback.find((f) => f.questionId === q.id);
          const answer = byQuestionId.get(q.id)?.answer ?? "(no answer)";
          return (
            <li key={q.id}>
              <div className="verification-card__question-prompt">{q.prompt}</div>
              {showAnswers ? (
                <div className="verification-card__answer">
                  <span className="verification-card__answer-label">Student answer:</span>
                  <pre className="prewrap">{answer}</pre>
                </div>
              ) : null}
              {fb ? (
                <div className="verification-card__feedback">
                  <span className={`verification-status verification-status--${fb.status}`}>
                    {STATUS_LABEL[fb.status]}
                  </span>
                  <span>{fb.feedback}</span>
                </div>
              ) : (
                <div className="verification-card__feedback verification-card__feedback--missing">
                  (no feedback recorded)
                </div>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );
}

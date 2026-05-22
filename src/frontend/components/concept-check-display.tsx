"use client";

import { useEffect, useState } from "react";
import { generateConceptCheckSet, listVerifications } from "../lib/api-client";
import type { ConceptCheckSet, ConceptCheckVerification } from "../lib/types/assignment";
import { VerificationForm } from "./verification-form";
import { VerificationResultDisplay } from "./verification-result-display";

type Props = {
  submissionId: string;
  initialSets: ConceptCheckSet[];
  viewerRole: "student" | "instructor";
};

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…`;
}

type SetCardProps = {
  set: ConceptCheckSet;
  viewerRole: "student" | "instructor";
  /** First (newest) set is expanded by default; older sets collapse to reduce noise. */
  defaultOpen?: boolean;
};

function ConceptCheckSetCard({ set, viewerRole, defaultOpen = false }: SetCardProps) {
  const [attempts, setAttempts] = useState<ConceptCheckVerification[]>([]);
  const [loadingAttempts, setLoadingAttempts] = useState(true);
  const [attemptsError, setAttemptsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoadingAttempts(true);
    setAttemptsError(null);
    listVerifications(set.id, viewerRole)
      .then((items) => {
        if (!cancelled) setAttempts(items);
      })
      .catch((err) => {
        if (!cancelled) {
          setAttemptsError(err instanceof Error ? err.message : String(err));
          setAttempts([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoadingAttempts(false);
      });
    return () => {
      cancelled = true;
    };
  }, [set.id, viewerRole]);

  const canSubmit = viewerRole === "student";

  const latestResult = attempts[0]?.result;
  const setMeta = `${new Date(set.generatedAt).toLocaleString()} · ${set.questionCount} q`;
  const summaryStatus = latestResult
    ? `latest: ${latestResult}`
    : loadingAttempts
      ? "…"
      : "no attempt yet";

  return (
    <li>
      <details className="disclosure" open={defaultOpen}>
        <summary>
          <span>
            {setMeta}
            <span style={{ color: "var(--muted)", marginLeft: 8 }}>· {summaryStatus}</span>
          </span>
          {viewerRole === "instructor" && set.referenceVersion != null ? (
            <span
              className="placeholder-tag reference-pin-tag"
              title={set.referenceHash ?? undefined}
              style={{ marginLeft: "auto", marginRight: 22 }}
            >
              Reference Guide v{set.referenceVersion}
            </span>
          ) : null}
        </summary>
        <div className="disclosure__body">
          <div className="concept-check__set-header">
            <span className="placeholder-tag">{set.provider}</span>
            <span className="placeholder-tag" title={set.policyHash}>
              policy v{set.policyVersion} · {shortHash(set.policyHash)}
            </span>
            {set.model ? (
              <span style={{ color: "var(--muted)", fontSize: 12 }}>{set.model}</span>
            ) : null}
          </div>

          <ol className="concept-check__questions">
            {set.questions.map((q) => (
              <li key={q.id}>
                <div className="concept-check__question-prompt">{q.prompt}</div>
                {q.conceptTag ? (
                  <div className="concept-check__question-tag">[{q.conceptTag}]</div>
                ) : null}
              </li>
            ))}
          </ol>

          <hr className="concept-check__divider" />

          <h3 className="concept-check__attempts-heading">Verification attempts</h3>

          {attemptsError ? <p className="form-error">{attemptsError}</p> : null}
          {loadingAttempts ? (
            <p style={{ color: "var(--muted)" }}>Loading attempts…</p>
          ) : attempts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>
              {canSubmit
                ? "No attempts yet. Answer the questions below to submit one."
                : "Student has not submitted answers for this set yet."}
            </p>
          ) : (
            <ol className="verification-card__list">
              {attempts.map((a) => (
                <li key={a.id}>
                  <VerificationResultDisplay
                    attempt={a}
                    questions={set.questions}
                    showAnswers={viewerRole === "instructor"}
                    showReferencePin={viewerRole === "instructor"}
                  />
                </li>
              ))}
            </ol>
          )}

          {canSubmit ? (
            <>
              <h3 className="concept-check__attempts-heading">
                {attempts.length === 0 ? "Answer the questions" : "Submit another attempt"}
              </h3>
              <VerificationForm
                conceptCheckSetId={set.id}
                questions={set.questions}
                onSubmitted={(attempt) => setAttempts((prev) => [attempt, ...prev])}
              />
            </>
          ) : null}
        </div>
      </details>
    </li>
  );
}

export function ConceptCheckDisplay({ submissionId, initialSets, viewerRole }: Props) {
  const [sets, setSets] = useState<ConceptCheckSet[]>(initialSets);
  const [questionCount, setQuestionCount] = useState(4);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const canGenerate = viewerRole === "student";

  async function generate() {
    setError(null);
    setPending(true);
    try {
      const result = await generateConceptCheckSet(submissionId, { questionCount });
      setSets((prev) => [result, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setPending(false);
    }
  }

  return (
    <div>
      {canGenerate ? (
        <div className="concept-check__controls">
          <label className="concept-check__count">
            <span>Questions</span>
            <input
              type="number"
              min={1}
              max={8}
              value={questionCount}
              onChange={(e) => {
                const n = Number.parseInt(e.target.value, 10);
                if (Number.isFinite(n)) {
                  setQuestionCount(Math.max(1, Math.min(8, n)));
                }
              }}
              disabled={pending}
            />
          </label>
          <button type="button" className="btn btn--primary" onClick={generate} disabled={pending}>
            {pending ? "Generating…" : "Generate concept checks"}
          </button>
        </div>
      ) : null}

      {error ? <p className="form-error">{error}</p> : null}

      {sets.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>
          {canGenerate
            ? "No concept checks yet. Generate to start a verification attempt."
            : "No concept checks generated yet."}
        </p>
      ) : (
        <ol className="concept-check__sets">
          {sets.map((s, i) => (
            <ConceptCheckSetCard key={s.id} set={s} viewerRole={viewerRole} defaultOpen={i === 0} />
          ))}
        </ol>
      )}
    </div>
  );
}

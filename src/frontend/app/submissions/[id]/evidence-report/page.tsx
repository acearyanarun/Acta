"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getEvidenceReport } from "../../../../lib/api-client";
import {
  AI_HELP_LABELS,
  EVIDENCE_REPORT_DISCLAIMER,
  type EvidenceReport,
  type EvidenceReportConceptCheckSet,
  type EvidenceReportVerificationAttempt,
  VERIFICATION_MODE_LABELS,
  type VerificationResult,
  type VerificationStatus,
} from "../../../../lib/types/assignment";

function resultPillClass(result: VerificationResult): string {
  switch (result) {
    case "pass":
      return "dashboard-pill verification-status--sufficient";
    case "needs_review":
      return "dashboard-pill verification-status--partial";
    case "fail":
      return "dashboard-pill verification-status--insufficient";
  }
}

function statusPillClass(status: VerificationStatus): string {
  switch (status) {
    case "sufficient":
      return "dashboard-pill verification-status--sufficient";
    case "partial":
      return "dashboard-pill verification-status--partial";
    case "insufficient":
      return "dashboard-pill verification-status--insufficient";
  }
}

function fmt(date: string): string {
  return new Date(date).toLocaleString();
}

const RESULT_VERB: Record<VerificationResult, string> = {
  pass: "Pass",
  needs_review: "Needs review",
  fail: "Fail",
};

function OutcomeBanner({ report }: { report: EvidenceReport }) {
  const latest = report.verificationAttempts[0];
  if (!latest) {
    return (
      <output className="outcome-banner outcome-banner--empty">No verification attempt yet.</output>
    );
  }
  const total = latest.perQuestionFeedback.length;
  const sufficient = latest.perQuestionFeedback.filter((f) => f.status === "sufficient").length;
  const modelOrProvider = latest.model ?? latest.provider;
  return (
    <output
      className={`outcome-banner outcome-banner--${latest.result}`}
      aria-label={`Result: ${RESULT_VERB[latest.result]}`}
    >
      <span className={resultPillClass(latest.result)}>{RESULT_VERB[latest.result]}</span>
      <span className="outcome-banner__detail">
        {sufficient} of {total} sufficient · evaluated {fmt(latest.evaluatedAt)} by{" "}
        {modelOrProvider}
      </span>
    </output>
  );
}

function ConceptCheckSetCard({ set }: { set: EvidenceReportConceptCheckSet }) {
  return (
    <div className="evidence-card">
      <div className="evidence-card__meta">
        <code title={set.id}>set {set.id.slice(0, 8)}…</code>
        <span style={{ color: "var(--muted)" }}>generated {fmt(set.generatedAt)}</span>
        <span className="placeholder-tag">{set.provider}</span>
        {set.model ? <span style={{ color: "var(--muted)" }}>{set.model}</span> : null}
        {set.referenceVersion != null ? (
          <span className="reference-pin-tag" title={set.referenceHash ?? undefined}>
            Generated with Instructor Solution Guide v{set.referenceVersion}
          </span>
        ) : null}
      </div>
      <ol className="evidence-questions">
        {set.questions.map((q) => (
          <li key={q.id}>
            <div className="evidence-q__prompt">{q.prompt}</div>
            {q.conceptTag ? (
              <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>tag: {q.conceptTag}</div>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  );
}

function VerificationAttemptCard({
  attempt,
  questionPromptById,
}: {
  attempt: EvidenceReportVerificationAttempt;
  questionPromptById: Map<string, string>;
}) {
  const answerByQid = new Map(attempt.answers.map((a) => [a.questionId, a.answer]));
  return (
    <div className="evidence-card">
      <div className="evidence-card__meta">
        <code title={attempt.id}>attempt {attempt.id.slice(0, 8)}…</code>
        <span className={resultPillClass(attempt.result)}>{attempt.result}</span>
        <span style={{ color: "var(--muted)" }}>evaluated {fmt(attempt.evaluatedAt)}</span>
        <span className="placeholder-tag">{attempt.provider}</span>
        {attempt.model ? <span style={{ color: "var(--muted)" }}>{attempt.model}</span> : null}
        {attempt.referenceVersion != null ? (
          <span className="reference-pin-tag" title={attempt.referenceHash ?? undefined}>
            Evaluated against Instructor Solution Guide v{attempt.referenceVersion}
          </span>
        ) : null}
      </div>
      {attempt.overallFeedback ? (
        <div className="evidence-feedback">
          <strong>Overall feedback:</strong>
          <p className="prewrap" style={{ margin: 0 }}>
            {attempt.overallFeedback}
          </p>
        </div>
      ) : null}
      <ol className="evidence-questions">
        {attempt.perQuestionFeedback.map((f) => {
          const prompt = questionPromptById.get(f.questionId) ?? f.questionId;
          const answer = answerByQid.get(f.questionId) ?? "";
          return (
            <li key={f.questionId}>
              <div className="evidence-q__prompt">{prompt}</div>
              <div className="evidence-q__answer">
                <strong>Student answer:</strong>{" "}
                <span className="prewrap">{answer || "(no answer)"}</span>
              </div>
              <div className="evidence-q__feedback">
                <span className={statusPillClass(f.status)}>{f.status}</span>{" "}
                <span className="prewrap">{f.feedback}</span>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

export default function EvidenceReportPage({ params }: { params: { id: string } }) {
  const [report, setReport] = useState<EvidenceReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [notAvailable, setNotAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setNotAvailable(false);
    setReport(null);
    getEvidenceReport(params.id)
      .then((r) => {
        if (!cancelled) setReport(r);
      })
      .catch(() => {
        if (!cancelled) setNotAvailable(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  if (loading) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  if (notAvailable || !report) {
    return (
      <section>
        <Link href={`/submissions/${params.id}?role=instructor`} className="back-link">
          ← Back to submission review
        </Link>
        <h1>Evidence report not available</h1>
        <p style={{ color: "var(--muted)" }}>
          This evidence report is not available, or you do not have instructor access to it.
        </p>
      </section>
    );
  }

  // Build a prompt lookup so verification feedback can show question text.
  const questionPromptById = new Map<string, string>();
  for (const set of report.conceptCheckSets) {
    for (const q of set.questions) {
      questionPromptById.set(q.id, q.prompt);
    }
  }

  const modeMeta = VERIFICATION_MODE_LABELS[report.policy.verificationMode];

  return (
    <section className="evidence-report-page">
      {/* Sprint C: breadcrumb. Hidden from print via @media print rules. */}
      <nav className="breadcrumb" aria-label="Breadcrumb">
        <Link href="/instructor/dashboard">Dashboard</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/instructor/${report.assignment.id}`}>{report.assignment.title}</Link>
        <span aria-hidden="true">›</span>
        <Link href={`/submissions/${params.id}?role=instructor`}>Submission</Link>
        <span aria-hidden="true">›</span>
        <span aria-current="page">Evidence report</span>
      </nav>

      {/* Toolbar — hidden from print */}
      <div className="evidence-toolbar">
        <Link href={`/submissions/${params.id}?role=instructor`} className="back-link">
          ← Back to submission
        </Link>
        <button type="button" className="btn btn--primary" onClick={() => window.print()}>
          Print / Save as PDF
        </button>
      </div>

      {/* 1. Header */}
      <section className="evidence-section evidence-section--header">
        <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
        <h1>Evidence-ready report</h1>
        <OutcomeBanner report={report} />
        <div className="kv">
          <div>
            <span>Assignment</span>
            <code>{report.assignment.title}</code>
          </div>
          <div>
            <span>Student ID</span>
            <code>{report.submission.studentId}</code>
          </div>
          <div>
            <span>Submission ID</span>
            <code>{report.submission.id}</code>
          </div>
          <div>
            <span>Generated at</span>
            <code>{fmt(report.generatedAt)}</code>
          </div>
        </div>
      </section>

      {/* 2. Assignment policy snapshot */}
      <details className="evidence-section disclosure" open>
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Assignment policy snapshot</h2>
          <span className="disclosure__hint">v{report.policy.policyVersion}</span>
        </summary>
        <div className="disclosure__body">
          <div className="kv">
            <div>
              <span>Policy version ID</span>
              <code>{report.policy.policyVersionId}</code>
            </div>
            <div>
              <span>Policy version</span>
              <code>v{report.policy.policyVersion}</code>
            </div>
            <div>
              <span>Policy hash</span>
              <code>{report.policy.policyHash}</code>
            </div>
            <div>
              <span>Verification mode</span>
              <code>
                {modeMeta.label} — {modeMeta.subtitle}
              </code>
            </div>
          </div>
          <h3>AI help rules</h3>
          <div className="policy-list__row" style={{ marginBottom: 8 }}>
            <strong>Student AI help (master):</strong>
            <span>{report.policy.aiHelpEnabled ? "Enabled" : "Disabled"}</span>
          </div>
          <ul className={`policy-list${report.policy.aiHelpEnabled ? "" : " ai-help-inactive"}`}>
            {(Object.keys(AI_HELP_LABELS) as (keyof typeof AI_HELP_LABELS)[]).map((k) => {
              const meta = AI_HELP_LABELS[k];
              const on = report.policy.aiHelp[k];
              const isHard = k === "restrictFinalAnswer";
              const stateLabel = isHard
                ? on
                  ? "Enabled"
                  : "Disabled"
                : on
                  ? "Allowed"
                  : "Not allowed";
              return (
                <li key={k} className={isHard ? "policy-list__item--hard" : ""}>
                  <div className="policy-list__row">
                    <strong>{meta.label}:</strong>
                    <span>{stateLabel}</span>
                    {isHard ? <span className="ai-help-row__pill">Hard rule</span> : null}
                  </div>
                </li>
              );
            })}
          </ul>
          <h3>Instructions</h3>
          <pre className="prewrap">{report.assignment.instructions}</pre>
          {report.assignment.rubric ? (
            <>
              <h3>Rubric</h3>
              <pre className="prewrap">{report.assignment.rubric}</pre>
            </>
          ) : null}
        </div>
      </details>

      {/* 3. Instructor Solution Guide snapshot */}
      <details className="evidence-section disclosure">
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Instructor Solution Guide snapshot</h2>
          <span className="disclosure__hint">
            {report.referenceSolution ? `v${report.referenceSolution.version}` : "none on file"}
          </span>
        </summary>
        <div className="disclosure__body">
          <p className="section-helper">
            Trusted reference Acta evaluated against. Visible to instructors only.
          </p>
          {report.referenceSolution ? (
            <>
              <div className="kv">
                <div>
                  <span>Reference solution ID</span>
                  <code>{report.referenceSolution.id}</code>
                </div>
                <div>
                  <span>Reference version</span>
                  <code>v{report.referenceSolution.version}</code>
                </div>
                <div>
                  <span>Reference hash</span>
                  <code>{report.referenceSolution.referenceHash}</code>
                </div>
              </div>
              <h3>Expected solution</h3>
              <pre className="prewrap">{report.referenceSolution.expectedSolution}</pre>
              <h3>Key concepts</h3>
              <ul>
                {report.referenceSolution.keyConcepts.map((kc) => (
                  <li key={kc}>{kc}</li>
                ))}
              </ul>
              <h3>Required reasoning steps</h3>
              <ol>
                {report.referenceSolution.requiredReasoningSteps.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ol>
              <h3>Common mistakes</h3>
              <ul>
                {report.referenceSolution.commonMistakes.map((m) => (
                  <li key={m}>{m}</li>
                ))}
              </ul>
              <h3>Correctness criteria</h3>
              <pre className="prewrap">{report.referenceSolution.correctnessCriteria}</pre>
              {report.referenceSolution.optionalNotes ? (
                <>
                  <h3>Optional notes</h3>
                  <pre className="prewrap">{report.referenceSolution.optionalNotes}</pre>
                </>
              ) : null}
            </>
          ) : (
            <p style={{ color: "var(--muted)" }}>
              No Instructor Solution Guide on file for this assignment.
            </p>
          )}
        </div>
      </details>

      {/* 4. Student submission */}
      <details className="evidence-section disclosure">
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Student submission</h2>
          <span className="disclosure__hint">{fmt(report.submission.submittedAt)}</span>
        </summary>
        <div className="disclosure__body">
          <div className="kv">
            <div>
              <span>Submitted at</span>
              <code>{fmt(report.submission.submittedAt)}</code>
            </div>
            <div>
              <span>Content hash</span>
              <code>{report.submission.contentHash}</code>
            </div>
          </div>
          <pre className="prewrap">{report.submission.content}</pre>
        </div>
      </details>

      {/* 5. Concept checks */}
      <details className="evidence-section disclosure" open>
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Concept checks</h2>
          <span className="disclosure__hint">
            {report.conceptCheckSets.length} set
            {report.conceptCheckSets.length === 1 ? "" : "s"}
          </span>
        </summary>
        <div className="disclosure__body">
          {report.conceptCheckSets.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No concept checks generated yet.</p>
          ) : (
            report.conceptCheckSets.map((s) => <ConceptCheckSetCard key={s.id} set={s} />)
          )}
        </div>
      </details>

      {/* 6. Verification attempts */}
      <details className="evidence-section disclosure" open>
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Verification attempts</h2>
          <span className="disclosure__hint">
            {report.verificationAttempts.length} attempt
            {report.verificationAttempts.length === 1 ? "" : "s"}
          </span>
        </summary>
        <div className="disclosure__body">
          <p className="section-helper">
            Verification result is a signal for instructor review — not a final grade.
          </p>
          {report.verificationAttempts.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>No verification attempt yet.</p>
          ) : (
            report.verificationAttempts.map((a) => (
              <VerificationAttemptCard
                key={a.id}
                attempt={a}
                questionPromptById={questionPromptById}
              />
            ))
          )}
        </div>
      </details>

      {/* 7. Provenance / hash summary */}
      <details className="evidence-section disclosure">
        <summary>
          <h2 style={{ margin: 0, fontSize: "1.1rem" }}>Provenance &amp; hash summary</h2>
          <span className="disclosure__hint">hash pins</span>
        </summary>
        <div className="disclosure__body">
          <div className="kv">
            <div>
              <span>Policy hash</span>
              <code>{report.provenance.policyHash}</code>
            </div>
            <div>
              <span>Reference hash (current)</span>
              <code>{report.provenance.referenceHash ?? "—"}</code>
            </div>
            <div>
              <span>Content hash</span>
              <code>{report.provenance.contentHash}</code>
            </div>
            <div>
              <span>Latest concept-check reference pin</span>
              <code>{report.provenance.latestConceptCheckReferenceHash ?? "—"}</code>
            </div>
            <div>
              <span>Latest verification reference pin</span>
              <code>{report.provenance.latestVerificationReferenceHash ?? "—"}</code>
            </div>
          </div>
        </div>
      </details>

      {/* 8. Disclaimer */}
      <section className="evidence-section evidence-section--disclaimer">
        <h2>Disclaimer</h2>
        <p>{EVIDENCE_REPORT_DISCLAIMER}</p>
      </section>
    </section>
  );
}

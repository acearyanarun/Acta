"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ReferenceSolutionSection } from "../../../components/reference-solution-section";
import { SubmissionList } from "../../../components/submission-list";
import { VersionBadge } from "../../../components/version-badge";
import {
  getAssignment,
  getReferenceSolution,
  listAssignmentSubmissions,
  listAssignmentVersions,
} from "../../../lib/api-client";
import {
  AI_HELP_LABELS,
  type Assignment,
  type AssignmentPolicyVersion,
  type ReferenceSolution,
  type Submission,
  VERIFICATION_MODE_LABELS,
} from "../../../lib/types/assignment";

export default function AssignmentViewPage({ params }: { params: { id: string } }) {
  const search = useSearchParams();
  const versionParam = search.get("version");
  const version = versionParam ? Number.parseInt(versionParam, 10) : undefined;

  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [versions, setVersions] = useState<AssignmentPolicyVersion[] | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reference, setReference] = useState<ReferenceSolution | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setError(null);
    Promise.all([
      getAssignment(params.id, version),
      listAssignmentVersions(params.id),
      listAssignmentSubmissions(params.id, "instructor"),
      getReferenceSolution(params.id).catch(() => null),
    ])
      .then(([a, vs, subs, ref]) => {
        setAssignment(a);
        setVersions(vs);
        setSubmissions(subs);
        setReference(ref);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.id, version]);

  if (error) return <p className="form-error">{error}</p>;
  if (!assignment) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  const isHistorical = version !== undefined && version !== assignment.currentVersion;
  const policy = assignment.policy;
  const modeMeta = VERIFICATION_MODE_LABELS[policy.verificationMode];

  return (
    <section>
      <div className="back-row">
        <Link href="/instructor" className="back-link">
          ← Back to assignments
        </Link>
        <Link href="/instructor/dashboard" className="back-row__link">
          → Open review dashboard
        </Link>
      </div>
      <div className="page-header">
        <div>
          <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
          <h1>{policy.title}</h1>
          <div className="assignment-card__meta">
            <VersionBadge version={policy.version} current={!isHistorical} />
            <span className="placeholder-tag">
              {VERIFICATION_MODE_LABELS[policy.verificationMode].label}
            </span>
          </div>
        </div>
        <Link href={`/instructor/${assignment.id}/edit`} className="btn btn--primary">
          Edit policy
        </Link>
      </div>

      {isHistorical ? (
        <div className="historical-banner">
          Viewing historical version {policy.version}. This is no longer the active policy.{" "}
          <Link href={`/instructor/${assignment.id}`}>Back to current</Link>
        </div>
      ) : null}

      {/* Sprint B: auto-prompt Solution Guide when missing — strengthens evaluation quality. */}
      {!reference && !isHistorical ? (
        <div className="nudge-banner">
          <div>
            <strong>Add a Solution Guide</strong>
            <span className="nudge-banner__sub">
              Strengthens concept-check generation and grading. Visible to instructors only.
            </span>
          </div>
          <a href="#instructor-solution-guide" className="btn btn--primary">
            Add Solution Guide
          </a>
        </div>
      ) : null}

      {/* Task checklist — what's done, what's pending */}
      <section className="task-card">
        <h2>Status</h2>
        <div className="task-card__row">
          <span className="task-card__label">Assignment policy</span>
          <span className="task-card__state task-card__state--done">Done · v{policy.version}</span>
        </div>
        <div className="task-card__row">
          <span className="task-card__label">Student AI help</span>
          <span
            className={`task-card__state ${policy.aiHelpEnabled ? "task-card__state--done" : "task-card__state--missing"}`}
          >
            {policy.aiHelpEnabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        <div className="task-card__row">
          <span className="task-card__label">Instructor Solution Guide</span>
          <span
            className={`task-card__state ${reference ? "task-card__state--done" : "task-card__state--missing"}`}
          >
            {reference ? `Done · v${reference.version}` : "Missing"}
          </span>
        </div>
        <div className="task-card__row">
          <span className="task-card__label">Student submissions</span>
          <span className="task-card__state">
            <span className="task-card__count">{submissions.length}</span>
            {submissions.length > 0 ? (
              <a href="#submissions" style={{ color: "var(--muted)", fontSize: 13 }}>
                view ↓
              </a>
            ) : null}
          </span>
        </div>
      </section>

      {/* Student submissions — moved up so it's easy to find */}
      <section id="submissions" className="placeholder-card">
        <h2>Student submissions</h2>
        <SubmissionList items={submissions} showStudent viewerRole="instructor" />
      </section>

      {/* Instructor Solution Guide — kept visible as a section but its inner component
          handles its own collapsed/expanded state. */}
      <section id="instructor-solution-guide" className="placeholder-card">
        <h2>Instructor Solution Guide</h2>
        <p className="section-helper">
          Trusted evaluation context. Students never see this content.
        </p>
        <ReferenceSolutionSection assignmentId={assignment.id} />
      </section>

      {/* Long-form policy details — collapsed by default */}
      <details className="disclosure">
        <summary>
          Instructions
          <span className="disclosure__hint">what the student will see</span>
        </summary>
        <div className="disclosure__body">
          <pre className="prewrap">{policy.instructions}</pre>
        </div>
      </details>

      {policy.rubric ? (
        <details className="disclosure">
          <summary>
            Rubric
            <span className="disclosure__hint">grading criteria</span>
          </summary>
          <div className="disclosure__body">
            <pre className="prewrap">{policy.rubric}</pre>
          </div>
        </details>
      ) : null}

      <details className="disclosure">
        <summary>
          AI help policy
          <span className="disclosure__hint">
            Student AI help: {policy.aiHelpEnabled ? "Enabled" : "Disabled"}
          </span>
        </summary>
        <div className="disclosure__body">
          <div className="policy-list__row" style={{ marginBottom: 10 }}>
            <strong>Student AI help:</strong>
            <span>{policy.aiHelpEnabled ? "Enabled" : "Disabled"}</span>
            <span className="ai-help-row__pill">{policy.aiHelpEnabled ? "Master" : "Off"}</span>
          </div>
          <ul
            className={`policy-list${policy.aiHelpEnabled ? "" : " ai-help-inactive"}`}
            aria-disabled={!policy.aiHelpEnabled}
          >
            {(Object.keys(AI_HELP_LABELS) as (keyof typeof AI_HELP_LABELS)[]).map((k) => {
              const meta = AI_HELP_LABELS[k];
              const on = policy.aiHelp[k];
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
        </div>
      </details>

      <details className="disclosure">
        <summary>
          Verification mode
          <span className="disclosure__hint">{modeMeta.label}</span>
        </summary>
        <div className="disclosure__body">
          <p>
            <strong>{modeMeta.label}.</strong> {modeMeta.subtitle}
          </p>
        </div>
      </details>

      <details className="disclosure">
        <summary>
          Provenance &amp; version history
          <span className="disclosure__hint">hash pins</span>
        </summary>
        <div className="disclosure__body">
          <div className="kv">
            <div>
              <span>Policy version ID</span>
              <code>{policy.id}</code>
            </div>
            <div>
              <span>Policy hash</span>
              <code>{policy.policyHash}</code>
            </div>
          </div>
          {versions && versions.length > 1 ? (
            <ul className="version-history" style={{ marginTop: 12 }}>
              {versions.map((v) => (
                <li key={v.id}>
                  <Link href={`/instructor/${assignment.id}?version=${v.version}`}>
                    v{v.version}
                  </Link>
                  {" — "}
                  <span style={{ color: "var(--muted)" }}>
                    {new Date(v.createdAt).toLocaleString()}
                  </span>
                  {v.version === assignment.currentVersion ? (
                    <span className="placeholder-tag" style={{ marginLeft: 8 }}>
                      current
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      </details>
    </section>
  );
}

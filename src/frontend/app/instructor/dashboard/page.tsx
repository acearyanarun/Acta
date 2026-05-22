"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getInstructorDashboard } from "../../../lib/api-client";
import {
  type InstructorDashboard,
  NEEDS_ATTENTION_LABEL,
  type NeedsAttentionRow,
  type NeedsAttentionStatus,
  type RecentSubmissionRow,
  type RecentVerificationRow,
  VERIFICATION_RESULT_LABELS,
  type VerificationResult,
} from "../../../lib/types/assignment";

function shortHash(hash: string | null | undefined): string {
  if (!hash) return "—";
  return `${hash.slice(0, 8)}…`;
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

function fmt(date: string): string {
  return new Date(date).toLocaleString();
}

function evidenceReportUrl(submissionId: string): string {
  return `/submissions/${submissionId}/evidence-report`;
}

function statusPillClass(status: NeedsAttentionStatus): string {
  switch (status) {
    case "submitted_no_checks":
      return "dashboard-pill dashboard-pill--neutral";
    case "checks_no_verification":
      return "dashboard-pill dashboard-pill--info";
    case "needs_review":
      return "dashboard-pill verification-status--partial";
    case "fail":
      return "dashboard-pill verification-status--insufficient";
  }
}

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

function SummaryCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="dashboard-card">
      <div className="dashboard-card__value">{value}</div>
      <div className="dashboard-card__label">{label}</div>
    </div>
  );
}

function NeedsAttentionTable({
  rows,
}: {
  rows: NeedsAttentionRow[];
}) {
  if (rows.length === 0) {
    return (
      <div className="placeholder-card">
        <p style={{ color: "var(--muted)", margin: 0 }}>No follow-up needed right now.</p>
      </div>
    );
  }
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Student</th>
            <th>Status</th>
            <th>Latest result</th>
            <th>Submitted</th>
            <th>Last activity</th>
            <th aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.submissionId}>
              <td>{r.assignmentTitle}</td>
              <td title={r.studentId}>{shortId(r.studentId)}</td>
              <td>
                <span className={statusPillClass(r.status)}>{NEEDS_ATTENTION_LABEL[r.status]}</span>
              </td>
              <td>
                {r.latestVerificationResult ? (
                  <span className={resultPillClass(r.latestVerificationResult)}>
                    {VERIFICATION_RESULT_LABELS[r.latestVerificationResult]}
                  </span>
                ) : (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </td>
              <td>{fmt(r.submittedAt)}</td>
              <td>{fmt(r.lastActivityAt)}</td>
              <td>
                <Link href={r.reviewUrl}>Review submission</Link>
                {r.latestVerificationResult ? (
                  <>
                    {" · "}
                    <Link href={evidenceReportUrl(r.submissionId)}>Evidence report</Link>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentSubmissionsTable({
  rows,
  submissionIdsWithVerification,
}: {
  rows: RecentSubmissionRow[];
  submissionIdsWithVerification: Set<string>;
}) {
  if (rows.length === 0) {
    return (
      <div className="placeholder-card">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No student submissions yet. Switch to Student Workspace to submit demo work.
        </p>
      </div>
    );
  }
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Student</th>
            <th>Submitted</th>
            <th>Policy</th>
            <th>Reference Guide</th>
            <th aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.submissionId}>
              <td>{r.assignmentTitle}</td>
              <td title={r.studentId}>{shortId(r.studentId)}</td>
              <td>{fmt(r.submittedAt)}</td>
              <td title={r.policyHash}>
                v{r.policyVersion} · {shortHash(r.policyHash)}
              </td>
              <td title={r.referenceHash ?? undefined}>
                {r.referenceVersion != null ? (
                  <>
                    v{r.referenceVersion} · {shortHash(r.referenceHash)}
                  </>
                ) : (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </td>
              <td>
                <Link href={r.reviewUrl}>Review submission</Link>
                {submissionIdsWithVerification.has(r.submissionId) ? (
                  <>
                    {" · "}
                    <Link href={evidenceReportUrl(r.submissionId)}>Evidence report</Link>
                  </>
                ) : null}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function RecentVerificationsTable({ rows }: { rows: RecentVerificationRow[] }) {
  if (rows.length === 0) {
    return (
      <div className="placeholder-card">
        <p style={{ color: "var(--muted)", margin: 0 }}>
          No verification attempts yet. Generate concept checks and submit verification from the
          student view.
        </p>
      </div>
    );
  }
  return (
    <div className="dashboard-table-wrap">
      <table className="dashboard-table">
        <thead>
          <tr>
            <th>Assignment</th>
            <th>Student</th>
            <th>Result</th>
            <th>Evaluated</th>
            <th>Provider</th>
            <th>Reference Guide</th>
            <th aria-label="Action" />
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.verificationId}>
              <td>{r.assignmentTitle}</td>
              <td title={r.studentId}>{shortId(r.studentId)}</td>
              <td>
                <span className={resultPillClass(r.result)}>
                  {VERIFICATION_RESULT_LABELS[r.result]}
                </span>
              </td>
              <td>{fmt(r.evaluatedAt)}</td>
              <td>
                <span className="placeholder-tag">{r.provider}</span>
                {r.model ? (
                  <span style={{ color: "var(--muted)", marginLeft: 6 }}>{r.model}</span>
                ) : null}
              </td>
              <td title={r.referenceHash ?? undefined}>
                {r.referenceVersion != null ? (
                  <>
                    v{r.referenceVersion} · {shortHash(r.referenceHash)}
                  </>
                ) : (
                  <span style={{ color: "var(--muted)" }}>—</span>
                )}
              </td>
              <td>
                <Link href={r.reviewUrl}>Review submission</Link>
                {" · "}
                <Link href={evidenceReportUrl(r.submissionId)}>Evidence report</Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function InstructorDashboardPage() {
  const [dashboard, setDashboard] = useState<InstructorDashboard | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getInstructorDashboard()
      .then(setDashboard)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  if (error) return <p className="form-error">{error}</p>;
  if (!dashboard) return <p style={{ color: "var(--muted)" }}>Loading…</p>;

  const s = dashboard.summary;
  // Submission ids that have at least one verification attempt — used to
  // conditionally render the "Evidence report" action link on
  // RecentSubmissionsTable rows.
  const submissionIdsWithVerification = new Set(
    dashboard.recentVerifications.map((v) => v.submissionId),
  );

  return (
    <section>
      <Link href="/instructor" className="back-link">
        ← Back to assignments
      </Link>
      <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
      <h1>Teacher Review Dashboard</h1>
      <p className="page-sub">Review submissions and follow-up needs at a glance.</p>

      <div className="dashboard-group">
        <h3 className="dashboard-group__label">Activity</h3>
        <section className="dashboard-cards">
          <SummaryCard label="Total assignments" value={s.totalAssignments} />
          <SummaryCard label="Total submissions" value={s.totalSubmissions} />
          <SummaryCard label="Pending checks" value={s.pendingConceptChecks} />
        </section>
      </div>

      <div className="dashboard-group">
        <h3 className="dashboard-group__label">Outcomes</h3>
        <section className="dashboard-cards">
          <SummaryCard label="Passed" value={s.passed} />
          <SummaryCard label="Needs review" value={s.needsReview} />
          <SummaryCard label="Failed" value={s.failed} />
          <SummaryCard label="Pending verification" value={s.pendingVerification} />
        </section>
      </div>

      <section className="placeholder-card">
        <h2>Needs attention</h2>
        <p className="section-helper">Stale items first.</p>
        <NeedsAttentionTable rows={dashboard.needsAttention} />
      </section>

      <details className="disclosure">
        <summary>
          Recent submissions
          <span className="disclosure__hint">{dashboard.recentSubmissions.length}</span>
        </summary>
        <div className="disclosure__body">
          <RecentSubmissionsTable
            rows={dashboard.recentSubmissions}
            submissionIdsWithVerification={submissionIdsWithVerification}
          />
        </div>
      </details>

      <details className="disclosure">
        <summary>
          Recent verification attempts
          <span className="disclosure__hint">{dashboard.recentVerifications.length}</span>
        </summary>
        <div className="disclosure__body">
          <RecentVerificationsTable rows={dashboard.recentVerifications} />
        </div>
      </details>
    </section>
  );
}

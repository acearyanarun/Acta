import Link from "next/link";
import type { Submission } from "../lib/types/assignment";

type Props = {
  items: Submission[];
  showStudent?: boolean; // true for instructor view, false for student "my submissions"
  emptyText?: string;
  /**
   * Role that owns the View link target. Determines the `?role=` query param so the
   * submission viewer renders in the correct mode (and shows / hides the Generate
   * concept-checks control).
   */
  viewerRole: "student" | "instructor";
};

function shortHash(hash: string): string {
  return `${hash.slice(0, 8)}…`;
}

function shortId(id: string): string {
  return `${id.slice(0, 8)}…`;
}

function snippet(text: string, max = 140): string {
  const cleaned = text.replace(/\s+/g, " ").trim();
  return cleaned.length <= max ? cleaned : `${cleaned.slice(0, max)}…`;
}

export function SubmissionList({ items, showStudent = false, emptyText, viewerRole }: Props) {
  const viewLabel = "View submission";
  // Role-aware empty default: instructor-facing list nudges to Student Workspace;
  // student "my submissions" nudges to the submit form above.
  const fallbackEmpty =
    viewerRole === "instructor"
      ? "No student submissions yet. Switch to Student Workspace to submit demo work."
      : "You haven't submitted work for this assignment yet.";
  const empty = emptyText ?? fallbackEmpty;
  if (items.length === 0) {
    return (
      <div className="banner banner--policy" role="status">
        <span className="banner__body">{empty}</span>
      </div>
    );
  }
  return (
    <ul className="submission-list">
      {items.map((s) => (
        <li key={s.id} className="card role-student submission-row">
          <div className="submission-row__meta">
            {showStudent ? (
              <span className="placeholder-tag" title={s.studentId}>
                student {shortId(s.studentId)}
              </span>
            ) : null}
            <span style={{ color: "var(--muted)" }}>
              {new Date(s.submittedAt).toLocaleString()}
            </span>
            <span className="placeholder-tag" title={s.policyHash}>
              policy v{s.policyVersion} · {shortHash(s.policyHash)}
            </span>
            <Link href={`/submissions/${s.id}?role=${viewerRole}`}>{viewLabel}</Link>
          </div>
          <div className="submission-row__snippet">{snippet(s.content)}</div>
        </li>
      ))}
    </ul>
  );
}

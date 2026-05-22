"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { VersionBadge } from "../../components/version-badge";
import { listAssignments } from "../../lib/api-client";
import { type Assignment, VERIFICATION_MODE_LABELS } from "../../lib/types/assignment";

export default function InstructorListPage() {
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    listAssignments()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <section>
      <span className="workspace-badge workspace-badge--instructor">Instructor Workspace</span>
      <div className="page-header">
        <div>
          <h1>Assignments</h1>
          <p className="page-sub">Create a policy, then review what students submit.</p>
        </div>
        <div className="page-header__actions">
          <Link href="/instructor/dashboard" className="btn btn--ghost">
            Review dashboard
          </Link>
          <Link href="/instructor/new" className="btn btn--primary">
            Create assignment policy
          </Link>
        </div>
      </div>

      {error ? <p className="form-error">{error}</p> : null}

      {items === null && !error ? <p style={{ color: "var(--muted)" }}>Loading…</p> : null}

      {items && items.length === 0 ? (
        <div className="placeholder-card">
          <p style={{ marginTop: 0 }}>
            <strong>No assignments yet.</strong> Create your first policy.
          </p>
          <Link href="/instructor/new" className="btn btn--primary">
            Create assignment policy
          </Link>
        </div>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="assignment-list">
          {items.map((a) => (
            <li key={a.id} className="placeholder-card">
              <Link href={`/instructor/${a.id}`} className="assignment-card">
                <div className="assignment-card__title">{a.policy.title}</div>
                <div className="assignment-card__meta">
                  <VersionBadge version={a.currentVersion} current />
                  <span className="placeholder-tag">
                    {VERIFICATION_MODE_LABELS[a.policy.verificationMode].label}
                  </span>
                  <span style={{ color: "var(--muted)" }}>
                    updated {new Date(a.updatedAt).toLocaleString()}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}

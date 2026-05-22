"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HashChip } from "../../components/atoms/hash-chip";
import { Pill } from "../../components/atoms/pill";
import { listStudentAssignments } from "../../lib/api-client";
import { type Assignment, VERIFICATION_MODE_LABELS } from "../../lib/types/assignment";

/**
 * Reads ?state=empty | ?state=loading from the URL. Used to drive demo
 * screenshots of the non-default branches without poking at backend state.
 * No-op on server render (returns null) and in any non-browser context.
 */
function readStateOverride(): "empty" | "loading" | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("state");
  if (v === "empty" || v === "loading") return v;
  return null;
}

export default function StudentListPage() {
  const [items, setItems] = useState<Assignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const override = readStateOverride();
    if (override === "empty") {
      setItems([]);
      return;
    }
    if (override === "loading") {
      // Leave items at null so the skeleton branch renders.
      return;
    }
    listStudentAssignments()
      .then(setItems)
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, []);

  return (
    <section>
      <p className="eyebrow">STUDENT WORKSPACE</p>
      <h1>Your assignments</h1>
      <p className="page-sub">View the work your instructor has assigned.</p>

      {error ? (
        <div className="banner banner--error" role="alert">
          <span className="banner__body">{error}</span>
        </div>
      ) : null}

      {items === null && !error ? (
        <>
          <section className="card card--skeleton role-student" aria-busy="true" aria-label="Loading assignments">
            <span className="skeleton-line skeleton-line--wide" />
            <span className="skeleton-line skeleton-line--narrow" />
          </section>
          <section className="card card--skeleton role-student" aria-hidden="true">
            <span className="skeleton-line skeleton-line--wide" />
            <span className="skeleton-line skeleton-line--narrow" />
          </section>
          <section className="card card--skeleton role-student" aria-hidden="true">
            <span className="skeleton-line skeleton-line--wide" />
            <span className="skeleton-line skeleton-line--narrow" />
          </section>
        </>
      ) : null}

      {items && items.length === 0 ? (
        <section className="card role-student">
          <p className="eyebrow">EMPTY STATE</p>
          <p className="empty-state__headline">No assignments yet.</p>
          <p className="empty-state__body">
            Your instructor hasn&apos;t published anything to your workspace. When they do,
            it&apos;ll appear here.
          </p>
          <p className="empty-state__action">
            <Link href="/" className="back-link">
              ← Back to home
            </Link>
          </p>
        </section>
      ) : null}

      {items && items.length > 0 ? (
        <ul className="assignment-list">
          {items.map((a) => (
            <li key={a.id} className="card card--interactive role-student">
              <Link href={`/student/${a.id}`} className="assignment-card">
                <p className="eyebrow">ASSIGNMENT</p>
                <div className="assignment-card__title">{a.policy.title}</div>
                <div className="assignment-card__meta">
                  <Pill as="span">{VERIFICATION_MODE_LABELS[a.policy.verificationMode].label}</Pill>
                  <HashChip hash={a.policy.policyHash} label="policy" prefix={7} />
                  {a.policy.aiHelp.restrictFinalAnswer ? (
                    <Pill as="span">Final answer restricted</Pill>
                  ) : null}
                  <span className="assignment-card__open-cue" aria-hidden="true">
                    OPEN →
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

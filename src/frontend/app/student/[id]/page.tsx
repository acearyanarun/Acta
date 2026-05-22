"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { HashChip } from "../../../components/atoms/hash-chip";
import { HelpChat } from "../../../components/help-chat";
import { PolicyBanner } from "../../../components/policy-banner";
import { SubmissionForm } from "../../../components/submission-form";
import { SubmissionList } from "../../../components/submission-list";
import { getStudentAssignment, listAssignmentSubmissions } from "../../../lib/api-client";
import type { Assignment, Submission } from "../../../lib/types/assignment";

/**
 * Reads ?state=empty | ?state=loading from the URL. Used to drive demo
 * screenshots of the non-default branches without poking at backend state.
 * Mirrors the pattern landed on /student page.tsx.
 *   - empty:   force submissions=[] so Step 4 renders its empty banner
 *   - loading: keep assignment=null so all four step bodies render as skeletons
 * No-op on server render (returns null) and in any non-browser context.
 */
function readStateOverride(): "empty" | "loading" | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("state");
  if (v === "empty" || v === "loading") return v;
  return null;
}

/** Demo stub used when ?state=empty is set on the URL — gives Step 1-3 something
 * to render while forcing Step 4 to show its empty-state banner. */
const DEMO_ASSIGNMENT: Assignment = {
  id: "demo",
  policy: {
    title: "Cellular respiration — short answer",
    instructions:
      "In your own words, explain how cellular respiration converts glucose into ATP. Name the three main stages and where each happens in the cell.",
    rubric:
      "Correct if the student names the three stages (glycolysis, Krebs cycle, electron transport chain) and identifies the cytoplasm vs mitochondrion locations.",
    referenceSolution: "",
    verificationMode: "confidence_score",
    aiHelpEnabled: true,
    aiHelp: {
      conceptExplanation: true,
      hints: true,
      examples: true,
      debuggingGuidance: false,
      restrictFinalAnswer: false,
    },
    policyVersion: 1,
    policyHash: "7964f79abcd1234567890ef1234567890",
  },
};

function SkeletonBody() {
  return (
    <section className="card card--skeleton role-student" aria-hidden="true">
      <span className="skeleton-line skeleton-line--wide" />
      <span className="skeleton-line skeleton-line--narrow" />
    </section>
  );
}

export default function StudentAssignmentPage({ params }: { params: { id: string } }) {
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const override = readStateOverride();
    if (override === "loading") {
      // Keep both at null/undefined so all step bodies render skeletons.
      return;
    }
    if (override === "empty") {
      setAssignment(DEMO_ASSIGNMENT);
      setSubmissions([]);
      return;
    }
    setError(null);
    Promise.all([getStudentAssignment(params.id), listAssignmentSubmissions(params.id, "student")])
      .then(([a, s]) => {
        setAssignment(a);
        setSubmissions(s);
      })
      .catch((err) => setError(err instanceof Error ? err.message : String(err)));
  }, [params.id]);

  if (error) {
    return (
      <section>
        <Link href="/student" className="back-link">
          ← Back to assignments
        </Link>
        <p className="eyebrow">STUDENT WORKSPACE</p>
        <h1>Assignment</h1>
        <div className="banner banner--error" role="alert">
          <span className="banner__body">{error}</span>
        </div>
      </section>
    );
  }

  const loadingAssignment = assignment === null;
  const loadingSubmissions = submissions === null;
  const policy = assignment?.policy;

  return (
    <section>
      <Link href="/student" className="back-link">
        ← Back to assignments
      </Link>
      <p className="eyebrow">STUDENT WORKSPACE</p>
      {/* H1 element stays in the DOM at all times — Phase 0 §6 a11y floor:
       * the heading region must announce stably across loading/loaded states.
       * During loading the skeleton-line sits INSIDE the h1; screen readers
       * still find the heading landmark. */}
      <h1>
        {loadingAssignment ? (
          <span className="skeleton-line skeleton-line--wide" aria-busy="true" aria-label="Loading assignment title" />
        ) : (
          policy?.title
        )}
      </h1>

      {/* Policy hash row — eyebrow label + HashChip */}
      <p className="hash-chip-row">
        <span className="eyebrow eyebrow--muted">
          POLICY {loadingAssignment ? "" : `v${policy?.policyVersion}`}
        </span>
        {loadingAssignment ? (
          <span className="skeleton-line skeleton-line--narrow" aria-hidden="true" />
        ) : policy ? (
          <HashChip hash={policy.policyHash} label="policy" prefix={7} />
        ) : null}
      </p>

      <ol className="stepper stepper--vertical">
        {/* Step 1 — Read */}
        <li className="stepper__step stepper__step--current" aria-current="step">
          <span className="stepper__num">[01]</span>
          <span className="stepper__label">Read the task</span>
          <span className="stepper__connector" aria-hidden="true" />
          <div className="stepper__body">
            {loadingAssignment ? (
              <SkeletonBody />
            ) : (
              <section className="card role-student">
                <p className="eyebrow">INSTRUCTIONS</p>
                <details className="disclosure" open>
                  <summary>
                    Instructions
                    <span className="disclosure__hint">tap to collapse</span>
                  </summary>
                  <div className="disclosure__body">
                    <pre className="prewrap">{policy?.instructions}</pre>
                  </div>
                </details>
                {policy?.rubric ? (
                  <>
                    <p className="eyebrow">RUBRIC</p>
                    <details className="disclosure">
                      <summary>
                        Rubric
                        <span className="disclosure__hint">how your work is graded</span>
                      </summary>
                      <div className="disclosure__body">
                        <pre className="prewrap">{policy.rubric}</pre>
                      </div>
                    </details>
                  </>
                ) : null}
                <p className="eyebrow">AI HELP RULES</p>
                <details className="disclosure">
                  <summary>
                    AI help rules
                    <span className="disclosure__hint">
                      {policy?.aiHelpEnabled
                        ? "what the chat below can do"
                        : "disabled for this assignment"}
                    </span>
                  </summary>
                  <div className="disclosure__body">
                    {policy ? (
                      <PolicyBanner policy={policy.aiHelp} aiHelpEnabled={policy.aiHelpEnabled} />
                    ) : null}
                  </div>
                </details>
              </section>
            )}
          </div>
        </li>

        {/* Step 2 — Ask */}
        <li className="stepper__step">
          <span className="stepper__num">[02]</span>
          <span className="stepper__label">Ask for help</span>
          <span className="stepper__connector" aria-hidden="true" />
          <div className="stepper__body">
            {loadingAssignment ? (
              <SkeletonBody />
            ) : policy?.aiHelpEnabled && assignment ? (
              <section className="card role-student">
                <p className="eyebrow">GUIDED HELP</p>
                <p className="section-helper">Help follows the instructor&apos;s rules.</p>
                <Link href={`/student/${assignment.id}/ta-lab`} className="btn btn--ghost ta-lab-cta">
                  [ OPEN TA LAB → ]
                </Link>
                <HelpChat assignment={assignment} />
              </section>
            ) : (
              <section className="card role-student">
                <p className="eyebrow">GUIDED HELP</p>
                <div className="banner banner--disabled" role="status">
                  <span className="banner__body">
                    AI guided help is disabled for this assignment.
                  </span>
                </div>
                <p className="section-helper">Continue to Step 3 to submit your work.</p>
              </section>
            )}
          </div>
        </li>

        {/* Step 3 — Submit */}
        <li className="stepper__step">
          <span className="stepper__num">[03]</span>
          <span className="stepper__label">Submit your work</span>
          <span className="stepper__connector" aria-hidden="true" />
          <div className="stepper__body">
            {loadingAssignment ? (
              <SkeletonBody />
            ) : assignment ? (
              <section className="card role-student">
                <p className="eyebrow">YOUR ANSWER</p>
                <SubmissionForm
                  assignmentId={assignment.id}
                  onSubmitted={(s) => setSubmissions((prev) => [s, ...(prev ?? [])])}
                />
              </section>
            ) : null}
          </div>
        </li>

        {/* Step 4 — Review */}
        <li className="stepper__step">
          <span className="stepper__num">[04]</span>
          <span className="stepper__label">Review your submissions</span>
          <div className="stepper__body">
            {loadingAssignment || loadingSubmissions ? (
              <SkeletonBody />
            ) : (
              <section className="card role-student">
                <p className="eyebrow">YOUR SUBMISSIONS</p>
                <p className="section-helper">
                  Open a submission to generate concept checks and answer them.
                </p>
                <SubmissionList
                  items={submissions ?? []}
                  viewerRole="student"
                  emptyText="You haven't submitted work yet."
                />
              </section>
            )}
          </div>
        </li>
      </ol>
    </section>
  );
}

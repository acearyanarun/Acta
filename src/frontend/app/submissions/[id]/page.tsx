"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { HashChip } from "../../../components/atoms/hash-chip";
import { Pill } from "../../../components/atoms/pill";
import { ConceptCheckDisplay } from "../../../components/concept-check-display";
import {
  getAssignment,
  getStudentAssignment,
  getSubmission,
  listConceptCheckSets,
} from "../../../lib/api-client";
import type { Assignment, ConceptCheckSet, Submission } from "../../../lib/types/assignment";

type ViewerRole = "instructor" | "student";

function resolveRoleParam(raw: string | null): ViewerRole {
  // Default to student so the student flow never lands in instructor/read-only mode.
  if (raw === "instructor") return "instructor";
  return "student";
}

/**
 * ?state=empty | ?state=loading override (same pattern as routes 1 + 2).
 *   - empty:   inject a DEMO_SUBMISSION + empty concept-check-sets so the
 *              "no checks yet" branch renders without hitting the backend.
 *   - loading: leave submission=null, never fetch — every card body renders
 *              as a skeleton.
 */
function readStateOverride(): "empty" | "loading" | null {
  if (typeof window === "undefined") return null;
  const v = new URLSearchParams(window.location.search).get("state");
  if (v === "empty" || v === "loading") return v;
  return null;
}

const DEMO_SUBMISSION: Submission = {
  id: "demo-submission",
  tenantId: "demo-tenant",
  assignmentId: "demo-assignment",
  studentId: "demo-student",
  policyVersionId: "demo-policy-version",
  policyVersion: 1,
  policyHash: "7964f79abcd1234567890ef1234567890",
  content:
    "Cellular respiration converts glucose into ATP through three main stages: glycolysis in the cytoplasm, the Krebs cycle in the mitochondrial matrix, and the electron transport chain across the inner mitochondrial membrane. Glycolysis breaks glucose into two pyruvate molecules and produces a small amount of ATP and NADH. The Krebs cycle oxidizes the carbons completely to CO2, generating more NADH and FADH2. The electron transport chain uses those electron carriers to pump protons and generate the bulk of the ATP via oxidative phosphorylation.",
  contentHash: "c0nten78901234567890abcdef0123456",
  submittedAt: "2026-05-12T14:30:00.000Z",
};

function SkeletonBody() {
  return (
    <section className="card card--skeleton" aria-hidden="true">
      <span className="skeleton-line skeleton-line--wide" />
      <span className="skeleton-line skeleton-line--narrow" />
    </section>
  );
}

export default function SubmissionViewPage({ params }: { params: { id: string } }) {
  const search = useSearchParams();
  const role: ViewerRole = resolveRoleParam(search.get("role"));

  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [sets, setSets] = useState<ConceptCheckSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const override = readStateOverride();
    if (override === "loading") {
      // Keep submission=null so the skeleton branch renders.
      return;
    }
    if (override === "empty") {
      setSubmission(DEMO_SUBMISSION);
      setAssignment({
        id: DEMO_SUBMISSION.assignmentId,
        policy: {
          title: "Cellular respiration — short answer",
          instructions: "",
          rubric: "",
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
          policyVersion: DEMO_SUBMISSION.policyVersion,
          policyHash: DEMO_SUBMISSION.policyHash,
        },
      });
      setSets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);
    setSubmission(null);
    setAssignment(null);
    setSets([]);

    let cancelled = false;
    (async () => {
      try {
        const s = await getSubmission(params.id, role);
        if (cancelled) return;
        setSubmission(s);

        // Chain the assignment fetch so the H1 can render the assignment title
        // (spec §3.1). One additional API call — acceptable cost. Failure does
        // not block the page; the H1 falls back to the generic role-based label.
        const assignmentFetcher = role === "instructor" ? getAssignment : getStudentAssignment;
        assignmentFetcher(s.assignmentId)
          .then((a) => {
            if (!cancelled) setAssignment(a);
          })
          .catch(() => {
            // Silent — H1 fallback covers this. Don't surface a banner for a
            // chrome-level data dependency.
          });

        try {
          const items = await listConceptCheckSets(params.id, role);
          if (!cancelled) setSets(items);
        } catch {
          if (!cancelled) setSets([]);
        }
      } catch {
        if (!cancelled) setNotFound(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [params.id, role]);

  const isInstructor = role === "instructor";
  const roleClass = isInstructor ? "role-instructor" : "role-student";

  // Loading branch ------------------------------------------------------
  if (loading) {
    return (
      <section>
        <div className="back-row">
          <Link
            href={isInstructor ? "/instructor" : "/student"}
            className="back-link"
          >
            ← Back
          </Link>
        </div>
        <p className="eyebrow">SUBMISSION</p>
        {/* H1 stays in the DOM at all times — skeleton sits inside.
            Pattern locked at route 2 sign-off (Phase 0 §6 a11y floor). */}
        <h1>
          <span
            className="skeleton-line skeleton-line--wide"
            aria-busy="true"
            aria-label="Loading submission"
          />
        </h1>
        <p className="hash-chip-row">
          <span className="eyebrow eyebrow--muted">LOADING</span>
          <span className="skeleton-line skeleton-line--narrow" aria-hidden="true" />
        </p>
        <SkeletonBody />
        <p className="eyebrow">CONCEPT CHECKS</p>
        <SkeletonBody />
      </section>
    );
  }

  // Not-found branch ----------------------------------------------------
  if (notFound || !submission) {
    const fallbackHome = isInstructor ? "/instructor" : "/student";
    return (
      <section>
        <Link href={fallbackHome} className="back-link">
          ← Back to {isInstructor ? "Instructor Workspace" : "Student Workspace"}
        </Link>
        <p className="eyebrow">SUBMISSION</p>
        <h1>Submission not found</h1>
        <div className="banner banner--error" role="alert">
          <span className="banner__body">
            This submission does not exist, or you do not have access to it in {role} mode.
          </span>
        </div>
        {isInstructor ? (
          <p className="section-helper">
            If this is your own submission as a student, open it via{" "}
            <Link href={`/submissions/${params.id}?role=student`}>student mode</Link>.
          </p>
        ) : (
          <p className="section-helper">
            If you are the instructor for this assignment, open it via{" "}
            <Link href={`/submissions/${params.id}?role=instructor`}>instructor mode</Link>.
          </p>
        )}
      </section>
    );
  }

  // Loaded branch -------------------------------------------------------
  const backHref = isInstructor
    ? `/instructor/${submission.assignmentId}`
    : `/student/${submission.assignmentId}`;
  const backLabel = isInstructor ? "← Back to instructor assignment" : "← Back to student assignment";
  const submissionEyebrow = isInstructor ? "STUDENT SUBMISSION" : "YOUR SUBMISSION";
  const assignmentTitle = assignment?.policy.title;
  const assignmentLoading = !assignment; // submission landed, assignment fetch still inflight or failed silently
  const submittedAt = new Date(submission.submittedAt).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });

  return (
    <section>
      <div className="back-row">
        <Link href={backHref} className="back-link">
          {backLabel}
        </Link>
        {isInstructor ? (
          <Link href={`/submissions/${submission.id}/evidence-report`} className="back-row__link">
            → Open evidence report
          </Link>
        ) : null}
      </div>

      <p className="eyebrow">SUBMISSION</p>
      {/* H1 reads the assignment title (spec §3.1). While the chained
       * assignment fetch is in flight, the H1 stays in the DOM with a
       * skeleton-line nested inside — heading landmark stable per route 2
       * sign-off pattern. If the assignment fetch fails silently, the
       * skeleton stays until navigation. */}
      <h1>
        {assignmentLoading ? (
          <span
            className="skeleton-line skeleton-line--wide"
            aria-busy="true"
            aria-label="Loading assignment title"
          />
        ) : (
          assignmentTitle
        )}
      </h1>

      {/* Hash chip row beneath H1 — eyebrow + submitted-at + content hash chip */}
      <p className="hash-chip-row">
        <span className="eyebrow eyebrow--muted">SUBMITTED {submittedAt.toUpperCase()}</span>
        <HashChip hash={submission.contentHash} label="content" prefix={7} />
        {isInstructor ? (
          <span className="eyebrow eyebrow--muted" title={submission.studentId}>
            STUDENT {submission.studentId.slice(0, 8)}
          </span>
        ) : null}
      </p>

      {/* Role toggle: two pills, one active, one navigates. */}
      <div className="role-toggle-group" role="tablist" aria-label="View as">
        <Pill
          as="link"
          href={`/submissions/${submission.id}?role=student`}
          active={!isInstructor}
        >
          STUDENT VIEW
        </Pill>
        <Pill
          as="link"
          href={`/submissions/${submission.id}?role=instructor`}
          active={isInstructor}
        >
          INSTRUCTOR VIEW
        </Pill>
      </div>

      {/* Submission body card with role-matched stripe. */}
      <section className={`card ${roleClass}`}>
        <p className="eyebrow">{submissionEyebrow}</p>
        <pre className="prewrap submission-body">{submission.content}</pre>
      </section>

      {/* Concept checks section. */}
      <p className="eyebrow" id="concept-checks">
        CONCEPT CHECKS
      </p>
      <section className={`card ${roleClass}`}>
        <p className="section-helper">
          {isInstructor
            ? "Read-only review of generated checks, student answers, and verification signals."
            : "Generate checks against your submission, then answer them to produce a verification signal."}
        </p>
        <ConceptCheckDisplay submissionId={submission.id} initialSets={sets} viewerRole={role} />
      </section>

      {/* Provenance — collapsed, with hash chips for the pinned anchors. */}
      <p className="eyebrow">PROVENANCE</p>
      <section className={`card ${roleClass}`}>
        <details className="disclosure">
          <summary>
            Hash pins
            <span className="disclosure__hint">policy + content anchors</span>
          </summary>
          <div className="disclosure__body">
            <div className="kv">
              <div>
                <span>Submission ID</span>
                <code>{submission.id}</code>
              </div>
              <div>
                <span>Content hash</span>
                <HashChip hash={submission.contentHash} label="content" prefix={10} />
              </div>
              <div>
                <span>Policy version ID</span>
                <code>{submission.policyVersionId}</code>
              </div>
              <div>
                <span>Policy hash</span>
                <HashChip hash={submission.policyHash} label="policy" prefix={10} />
              </div>
            </div>
          </div>
        </details>
      </section>
    </section>
  );
}

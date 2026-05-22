import type {
  Assignment,
  ConceptCheckSet,
  ConceptCheckVerification,
  InstructorDashboard,
  NeedsAttentionRow,
  NeedsAttentionStatus,
  RecentSubmissionRow,
  RecentVerificationRow,
  Submission,
  VerificationResult,
} from "./types.js";

export const NEEDS_ATTENTION_CAP = 50;
export const RECENT_SUBMISSIONS_CAP = 20;
export const RECENT_VERIFICATIONS_CAP = 20;

export type AggregateInput = {
  assignments: Assignment[];
  submissions: Submission[];
  sets: ConceptCheckSet[];
  verifications: ConceptCheckVerification[];
};

function reviewUrl(submissionId: string): string {
  return `/submissions/${submissionId}?role=instructor`;
}

function maxIso(...values: (string | undefined | null)[]): string {
  // ISO-8601 lexicographic compare = chronological compare.
  let best = "";
  for (const v of values) {
    if (typeof v === "string" && v > best) best = v;
  }
  return best;
}

type SubmissionStatus =
  | { kind: "submitted_no_checks" }
  | { kind: "checks_no_verification"; latestSet: ConceptCheckSet }
  | {
      kind: VerificationResult;
      latestSet: ConceptCheckSet;
      latestAttempt: ConceptCheckVerification;
    };

function resolveStatus(
  submission: Submission,
  setsBySubmission: Map<string, ConceptCheckSet[]>,
  verificationsBySet: Map<string, ConceptCheckVerification[]>,
): SubmissionStatus {
  const setList = setsBySubmission.get(submission.id);
  if (!setList || setList.length === 0) return { kind: "submitted_no_checks" };
  // setList is sorted DESC by generatedAt — first is latest.
  const latestSet = setList[0];
  if (!latestSet) return { kind: "submitted_no_checks" };

  const attempts = verificationsBySet.get(latestSet.id);
  if (!attempts || attempts.length === 0) {
    return { kind: "checks_no_verification", latestSet };
  }
  // attempts sorted DESC by evaluatedAt — first is latest.
  const latestAttempt = attempts[0];
  if (!latestAttempt) return { kind: "checks_no_verification", latestSet };
  return { kind: latestAttempt.result, latestSet, latestAttempt };
}

export function aggregateInstructorDashboard(input: AggregateInput): InstructorDashboard {
  // Build lookups.
  const assignmentTitleById = new Map<string, string>();
  for (const a of input.assignments) {
    assignmentTitleById.set(a.id, a.policy.title);
  }

  const setsBySubmission = new Map<string, ConceptCheckSet[]>();
  for (const s of input.sets) {
    const arr = setsBySubmission.get(s.submissionId) ?? [];
    arr.push(s);
    setsBySubmission.set(s.submissionId, arr);
  }
  for (const arr of setsBySubmission.values()) {
    arr.sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  }

  const verificationsBySet = new Map<string, ConceptCheckVerification[]>();
  for (const v of input.verifications) {
    const arr = verificationsBySet.get(v.conceptCheckSetId) ?? [];
    arr.push(v);
    verificationsBySet.set(v.conceptCheckSetId, arr);
  }
  for (const arr of verificationsBySet.values()) {
    arr.sort((a, b) => (a.evaluatedAt < b.evaluatedAt ? 1 : -1));
  }

  // Per-submission status pass.
  let pendingConceptChecks = 0;
  let pendingVerification = 0;
  let passed = 0;
  let needsReview = 0;
  let failed = 0;

  const needsAttention: NeedsAttentionRow[] = [];

  for (const submission of input.submissions) {
    // Defensive: drop submissions whose assignment isn't visible to this tenant scope.
    const title = assignmentTitleById.get(submission.assignmentId);
    if (title === undefined) continue;

    const status = resolveStatus(submission, setsBySubmission, verificationsBySet);

    let lastActivityAt = submission.submittedAt;
    let needsRow: NeedsAttentionStatus | null = null;
    let latestVerificationResult: VerificationResult | null = null;

    if (status.kind === "submitted_no_checks") {
      pendingConceptChecks += 1;
      needsRow = "submitted_no_checks";
    } else if (status.kind === "checks_no_verification") {
      pendingVerification += 1;
      lastActivityAt = maxIso(lastActivityAt, status.latestSet.generatedAt);
      needsRow = "checks_no_verification";
    } else {
      lastActivityAt = maxIso(
        lastActivityAt,
        status.latestSet.generatedAt,
        status.latestAttempt.evaluatedAt,
      );
      latestVerificationResult = status.kind;
      if (status.kind === "pass") {
        passed += 1;
      } else if (status.kind === "needs_review") {
        needsReview += 1;
        needsRow = "needs_review";
      } else if (status.kind === "fail") {
        failed += 1;
        needsRow = "fail";
      }
    }

    if (needsRow) {
      needsAttention.push({
        assignmentId: submission.assignmentId,
        assignmentTitle: title,
        submissionId: submission.id,
        studentId: submission.studentId,
        status: needsRow,
        latestVerificationResult,
        submittedAt: submission.submittedAt,
        lastActivityAt,
        reviewUrl: reviewUrl(submission.id),
      });
    }
  }

  // Oldest-first by lastActivityAt — most-stale follow-ups surface first.
  needsAttention.sort((a, b) => (a.lastActivityAt < b.lastActivityAt ? -1 : 1));
  const cappedNeedsAttention = needsAttention.slice(0, NEEDS_ATTENTION_CAP);

  // Recent submissions newest-first.
  const recentSubmissions: RecentSubmissionRow[] = input.submissions
    .filter((s) => assignmentTitleById.has(s.assignmentId))
    .slice() // copy before sort
    .sort((a, b) => (a.submittedAt < b.submittedAt ? 1 : -1))
    .slice(0, RECENT_SUBMISSIONS_CAP)
    .map((s) => {
      const setList = setsBySubmission.get(s.id);
      const latestSet = setList && setList.length > 0 ? setList[0] : undefined;
      return {
        assignmentId: s.assignmentId,
        assignmentTitle: assignmentTitleById.get(s.assignmentId) ?? "",
        submissionId: s.id,
        studentId: s.studentId,
        policyVersion: s.policyVersion,
        policyHash: s.policyHash,
        referenceVersion: latestSet?.referenceVersion ?? null,
        referenceHash: latestSet?.referenceHash ?? null,
        submittedAt: s.submittedAt,
        reviewUrl: reviewUrl(s.id),
      };
    });

  // Recent verifications newest-first.
  const recentVerifications: RecentVerificationRow[] = input.verifications
    .filter((v) => assignmentTitleById.has(v.assignmentId))
    .slice()
    .sort((a, b) => (a.evaluatedAt < b.evaluatedAt ? 1 : -1))
    .slice(0, RECENT_VERIFICATIONS_CAP)
    .map((v) => ({
      assignmentId: v.assignmentId,
      assignmentTitle: assignmentTitleById.get(v.assignmentId) ?? "",
      submissionId: v.submissionId,
      conceptCheckSetId: v.conceptCheckSetId,
      verificationId: v.id,
      studentId: v.studentId,
      result: v.result,
      provider: v.provider,
      model: v.model,
      referenceVersion: v.referenceVersion,
      referenceHash: v.referenceHash,
      evaluatedAt: v.evaluatedAt,
      reviewUrl: reviewUrl(v.submissionId),
    }));

  return {
    summary: {
      totalAssignments: input.assignments.length,
      totalSubmissions: input.submissions.length,
      pendingConceptChecks,
      pendingVerification,
      passed,
      needsReview,
      failed,
    },
    needsAttention: cappedNeedsAttention,
    recentSubmissions,
    recentVerifications,
  };
}

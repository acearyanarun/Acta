import type {
  Assignment,
  ConceptCheckSet,
  ConceptCheckVerification,
  EvidenceReport,
  EvidenceReportConceptCheckSet,
  EvidenceReportVerificationAttempt,
  ReferenceSolution,
  Submission,
} from "./types.js";

export type BuildEvidenceReportInput = {
  assignment: Assignment;
  submission: Submission;
  referenceSolution: ReferenceSolution | null;
  conceptCheckSets: ConceptCheckSet[];
  verifications: ConceptCheckVerification[];
  /** Injected for determinism in tests. */
  generatedAt?: string;
};

/**
 * Pure assembly over already-loaded rows. No I/O. No AI invocation. No ledger
 * emission. Used by `GET /v1/submissions/:id/evidence-report` and by the
 * frontend printable report page.
 *
 * Ordering:
 * - `conceptCheckSets` newest-first (DESC by `generatedAt`).
 * - `verificationAttempts` newest-first (DESC by `evaluatedAt`). ALL attempts are
 *   included; no truncation.
 *
 * Reference snapshot policy: `referenceSolution` is the CURRENT reference for the
 * assignment at report-generation time (caller resolves it). Per-set and
 * per-verification reference pins (D-041) are preserved on each row so the
 * historical anchor used at generation/evaluation time remains visible.
 */
export function buildEvidenceReport(input: BuildEvidenceReportInput): EvidenceReport {
  const generatedAt = input.generatedAt ?? new Date().toISOString();

  const sets = [...input.conceptCheckSets].sort((a, b) => (a.generatedAt < b.generatedAt ? 1 : -1));
  const attempts = [...input.verifications].sort((a, b) =>
    a.evaluatedAt < b.evaluatedAt ? 1 : -1,
  );

  const conceptCheckSets: EvidenceReportConceptCheckSet[] = sets.map((s) => ({
    id: s.id,
    generatedAt: s.generatedAt,
    provider: s.provider,
    model: s.model,
    referenceSolutionId: s.referenceSolutionId,
    referenceVersion: s.referenceVersion,
    referenceHash: s.referenceHash,
    questions: s.questions,
  }));

  const verificationAttempts: EvidenceReportVerificationAttempt[] = attempts.map((v) => ({
    id: v.id,
    conceptCheckSetId: v.conceptCheckSetId,
    result: v.result,
    overallFeedback: v.overallFeedback,
    // VerificationAnswer already carries optional modality + transcriptHash +
    // transcriptionProvider + transcriptionModel + transcriptEdited (D-048).
    // No transformation needed — the embedded answers ride through.
    answers: v.answers,
    perQuestionFeedback: v.perQuestionFeedback,
    provider: v.provider,
    model: v.model,
    referenceSolutionId: v.referenceSolutionId,
    referenceVersion: v.referenceVersion,
    referenceHash: v.referenceHash,
    evaluatedAt: v.evaluatedAt,
    hasVoiceAnswers: v.hasVoiceAnswers,
  }));

  const latestSetReferenceHash = conceptCheckSets[0]?.referenceHash ?? null;
  const latestVerificationReferenceHash = verificationAttempts[0]?.referenceHash ?? null;

  return {
    generatedAt,
    assignment: {
      id: input.assignment.id,
      title: input.assignment.policy.title,
      instructions: input.assignment.policy.instructions,
      rubric: input.assignment.policy.rubric,
    },
    policy: {
      policyVersionId: input.assignment.policy.id,
      policyVersion: input.assignment.policy.version,
      policyHash: input.assignment.policy.policyHash,
      aiHelp: input.assignment.policy.aiHelp,
      aiHelpEnabled: input.assignment.policy.aiHelpEnabled,
      verificationMode: input.assignment.policy.verificationMode,
    },
    referenceSolution: input.referenceSolution,
    submission: {
      id: input.submission.id,
      studentId: input.submission.studentId,
      submittedAt: input.submission.submittedAt,
      content: input.submission.content,
      contentHash: input.submission.contentHash,
      policyVersionId: input.submission.policyVersionId,
      policyVersion: input.submission.policyVersion,
      policyHash: input.submission.policyHash,
    },
    conceptCheckSets,
    verificationAttempts,
    provenance: {
      policyHash: input.submission.policyHash,
      referenceHash: input.referenceSolution?.referenceHash ?? null,
      contentHash: input.submission.contentHash,
      latestConceptCheckReferenceHash: latestSetReferenceHash,
      latestVerificationReferenceHash: latestVerificationReferenceHash,
    },
  };
}

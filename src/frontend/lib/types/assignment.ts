export type VerificationMode = "score" | "gate" | "fail_only";

export type AiHelpPolicy = {
  conceptExplanation: boolean;
  hints: boolean;
  examples: boolean;
  debuggingGuidance: boolean;
  restrictFinalAnswer: boolean;
};

export type AssignmentPolicyVersion = {
  id: string;
  assignmentId: string;
  tenantId: string;
  instructorId: string;
  version: number;
  title: string;
  instructions: string;
  rubric: string | null;
  aiHelp: AiHelpPolicy;
  /**
   * D-047: master toggle for student-facing guided help. When false, the help
   * route refuses all requests regardless of per-type sub-flags. Older payloads
   * may omit the field — read sites should default to true.
   */
  aiHelpEnabled: boolean;
  verificationMode: VerificationMode;
  policyHash: string;
  createdAt: string;
};

export type Assignment = {
  id: string;
  tenantId: string;
  instructorId: string;
  currentVersion: number;
  policy: AssignmentPolicyVersion;
  createdAt: string;
  updatedAt: string;
};

export type CreateAssignmentInput = {
  title: string;
  instructions: string;
  rubric?: string | null;
  aiHelp: AiHelpPolicy;
  /** Optional; backend defaults to true when omitted. */
  aiHelpEnabled?: boolean;
  verificationMode: VerificationMode;
};

export const VERIFICATION_MODE_LABELS: Record<
  VerificationMode,
  { label: string; subtitle: string }
> = {
  score: {
    label: "Confidence score",
    subtitle: "I'll see a score. My call what to do with it.",
  },
  gate: {
    label: "Required gate",
    subtitle: "Students must pass the check to receive credit.",
  },
  fail_only: {
    label: "Fail-only escalation",
    subtitle: "Only triggered if a student's check fails.",
  },
};

export type ChatMessage = {
  role: "student" | "assistant";
  content: string;
};

export type HelpRequestType = "hint" | "explanation" | "example" | "debugging" | "general";

export type HelpOutcome = "answered" | "refused" | "redirected";

export type Submission = {
  id: string;
  tenantId: string;
  assignmentId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  content: string;
  contentHash: string;
  submittedAt: string;
};

export type CreateSubmissionInput = { content: string };

export type ConceptCheckQuestion = {
  id: string;
  ordinal: number;
  prompt: string;
  conceptTag?: string;
};

export type ConceptCheckSet = {
  id: string;
  tenantId: string;
  assignmentId: string;
  submissionId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  submissionContentHash: string;
  questions: ConceptCheckQuestion[];
  questionCount: number;
  provider: "stub" | "anthropic" | "openai";
  model: string | null;
  generatedAt: string;
  // D-041: reference pin (nullable).
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

export type GenerateConceptChecksInput = { questionCount?: number };

export type VerificationResult = "pass" | "needs_review" | "fail";
export type VerificationStatus = "sufficient" | "partial" | "insufficient";

export type AnswerModality = "text" | "voice";
export type TranscriptionProviderName = "stub" | "openai";

export type VerificationAnswer = {
  questionId: string;
  answer: string;
  /** D-048: per-answer modality. Defaults to "text" when absent. */
  modality?: AnswerModality;
  /** SHA-256 of `answer` when modality === "voice". */
  transcriptHash?: string | null;
  transcriptionProvider?: TranscriptionProviderName | null;
  transcriptionModel?: string | null;
  /** True when the student edited the transcript before submitting. */
  transcriptEdited?: boolean;
};

export type TranscribeResponse = {
  transcript: string;
  transcriptHash: string;
  provider: TranscriptionProviderName;
  model: string | null;
  durationSec: number | null;
};

/** Conversational TA voice input — same wire shape as the verification path. */
export type TranscribeHelpResponse = TranscribeResponse;

export type PerQuestionFeedback = {
  questionId: string;
  status: VerificationStatus;
  feedback: string;
};

export type ConceptCheckVerification = {
  id: string;
  tenantId: string;
  assignmentId: string;
  submissionId: string;
  conceptCheckSetId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  submissionContentHash: string;
  answers: VerificationAnswer[];
  result: VerificationResult;
  overallFeedback: string;
  perQuestionFeedback: PerQuestionFeedback[];
  provider: "stub" | "anthropic" | "openai";
  model: string | null;
  evaluatedAt: string;
  /** D-048: true when any answer.modality === "voice". */
  hasVoiceAnswers: boolean;
  // D-041: reference pin (nullable).
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

export type CreateConceptCheckVerificationInput = { answers: VerificationAnswer[] };

export const VERIFICATION_RESULT_LABELS: Record<VerificationResult, string> = {
  pass: "Pass",
  needs_review: "Needs review",
  fail: "Fail",
};

export type HelpResponse = {
  assistantMessage: { role: "assistant"; content: string };
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  policyApplied: AiHelpPolicy;
  outcome: HelpOutcome;
  outcomeReason?: string;
  provider: "stub" | "anthropic" | "openai";
};

export const HELP_REQUEST_TYPES: HelpRequestType[] = [
  "hint",
  "explanation",
  "example",
  "debugging",
  "general",
];

export const HELP_REQUEST_LABELS: Record<HelpRequestType, string> = {
  hint: "Hint",
  explanation: "Explanation",
  example: "Example",
  debugging: "Debugging",
  general: "General",
};

export function helpTypeAllowedFlag(type: HelpRequestType): keyof AiHelpPolicy | null {
  switch (type) {
    case "hint":
      return "hints";
    case "explanation":
      return "conceptExplanation";
    case "example":
      return "examples";
    case "debugging":
      return "debuggingGuidance";
    case "general":
      return null;
  }
}

export const AI_HELP_LABELS: Record<keyof AiHelpPolicy, { label: string; helper: string }> = {
  conceptExplanation: {
    label: "Concept explanation",
    helper: "AI may explain underlying concepts.",
  },
  hints: { label: "Hints", helper: "AI may nudge the student toward an approach." },
  examples: { label: "Examples", helper: "AI may show analogous examples." },
  debuggingGuidance: {
    label: "Debugging guidance",
    helper: "AI may help debug the student's own attempt.",
  },
  restrictFinalAnswer: {
    label: "Restrict final answer",
    helper: "Hard rule: AI must not give the final answer.",
  },
};

export type ReferenceSolution = {
  id: string;
  tenantId: string;
  assignmentId: string;
  instructorId: string;
  version: number;
  expectedSolution: string;
  keyConcepts: string[];
  requiredReasoningSteps: string[];
  commonMistakes: string[];
  correctnessCriteria: string;
  optionalNotes: string | null;
  referenceHash: string;
  createdAt: string;
};

export type CreateReferenceSolutionInput = {
  expectedSolution: string;
  keyConcepts: string[];
  requiredReasoningSteps: string[];
  commonMistakes: string[];
  correctnessCriteria: string;
  optionalNotes?: string | null;
};

// ---- Instructor dashboard (read-only aggregation) ----

export type NeedsAttentionStatus =
  | "submitted_no_checks"
  | "checks_no_verification"
  | "needs_review"
  | "fail";

export type DashboardSummary = {
  totalAssignments: number;
  totalSubmissions: number;
  pendingConceptChecks: number;
  pendingVerification: number;
  passed: number;
  needsReview: number;
  failed: number;
};

export type NeedsAttentionRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  studentId: string;
  status: NeedsAttentionStatus;
  latestVerificationResult: VerificationResult | null;
  submittedAt: string;
  lastActivityAt: string;
  reviewUrl: string;
};

export type RecentSubmissionRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  studentId: string;
  policyVersion: number;
  policyHash: string;
  referenceVersion: number | null;
  referenceHash: string | null;
  submittedAt: string;
  reviewUrl: string;
};

export type RecentVerificationRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  conceptCheckSetId: string;
  verificationId: string;
  studentId: string;
  result: VerificationResult;
  provider: "stub" | "anthropic" | "openai";
  model: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
  evaluatedAt: string;
  reviewUrl: string;
};

export type InstructorDashboard = {
  summary: DashboardSummary;
  needsAttention: NeedsAttentionRow[];
  recentSubmissions: RecentSubmissionRow[];
  recentVerifications: RecentVerificationRow[];
};

export const NEEDS_ATTENTION_LABEL: Record<NeedsAttentionStatus, string> = {
  submitted_no_checks: "Submitted · No checks",
  checks_no_verification: "Checks · No verification",
  needs_review: "Needs review",
  fail: "Fail",
};

// ---- Evidence export (read-only assembly over existing rows) ----

export type EvidenceReportAssignment = {
  id: string;
  title: string;
  instructions: string;
  rubric: string | null;
};

export type EvidenceReportPolicy = {
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  aiHelp: AiHelpPolicy;
  aiHelpEnabled: boolean;
  verificationMode: VerificationMode;
};

export type EvidenceReportSubmission = {
  id: string;
  studentId: string;
  submittedAt: string;
  content: string;
  contentHash: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
};

export type EvidenceReportConceptCheckSet = {
  id: string;
  generatedAt: string;
  provider: "stub" | "anthropic" | "openai";
  model: string | null;
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
  questions: ConceptCheckQuestion[];
};

export type EvidenceReportVerificationAttempt = {
  id: string;
  conceptCheckSetId: string;
  result: VerificationResult;
  overallFeedback: string;
  answers: VerificationAnswer[];
  perQuestionFeedback: PerQuestionFeedback[];
  provider: "stub" | "anthropic" | "openai";
  model: string | null;
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
  evaluatedAt: string;
  /** D-048: true if any answer in this attempt was a voice transcript. */
  hasVoiceAnswers: boolean;
};

export type EvidenceReportProvenance = {
  policyHash: string;
  referenceHash: string | null;
  contentHash: string;
  latestConceptCheckReferenceHash: string | null;
  latestVerificationReferenceHash: string | null;
};

export type EvidenceReport = {
  generatedAt: string;
  assignment: EvidenceReportAssignment;
  policy: EvidenceReportPolicy;
  referenceSolution: ReferenceSolution | null;
  submission: EvidenceReportSubmission;
  conceptCheckSets: EvidenceReportConceptCheckSet[];
  verificationAttempts: EvidenceReportVerificationAttempt[];
  provenance: EvidenceReportProvenance;
};

/**
 * Disclaimer text rendered at the bottom of the evidence report page. Kept as a
 * single constant so the test suite can string-match it and the page renders
 * the same copy.
 */
export const EVIDENCE_REPORT_DISCLAIMER =
  "This report is an evidence-ready instructional review artifact. It records assignment policy, reference context, student submission, concept checks, verification answers, and hash pins. It is not an AI-detection result, not a final course grade, and not a legal determination.";

/** Short scope disclaimer shown in the report header. */
export const EVIDENCE_REPORT_HEADER_DISCLAIMER =
  "Verification signal for instructor review. Not a final course grade.";

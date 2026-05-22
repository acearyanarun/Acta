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
   * Master toggle for student-facing guided help (D-047). When false, the help
   * route refuses all requests for this policy version regardless of help-type
   * sub-flags. Existing policy rows default to true so prior demo data keeps
   * working. Hash-included so different toggle states produce different policy
   * hashes.
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
  /** Optional on input; defaults to true at the validator. See AssignmentPolicyVersion.aiHelpEnabled. */
  aiHelpEnabled?: boolean;
  verificationMode: VerificationMode;
};

export type AuthContext = {
  tenantId: string;
  instructorId: string;
};

export type StudentAuthContext = {
  tenantId: string;
  // Exactly one of these is set, derived from headers (D-024).
  instructorId?: string;
  studentId?: string;
};

export type ChatMessage = {
  role: "student" | "assistant";
  content: string;
};

export type HelpRequestType = "hint" | "explanation" | "example" | "debugging" | "general";

export type HelpOutcome = "answered" | "refused" | "redirected";

export type HelpRequest = {
  messages: ChatMessage[];
  requestType?: HelpRequestType;
};

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

export type CreateSubmissionInput = {
  content: string;
};

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
  // D-041: reference pin (nullable). Present when an Instructor Solution Guide
  // existed for the assignment at generation time.
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

export type GenerateConceptChecksInput = {
  questionCount?: number; // 1..8, default 4 (D-030)
};

export type VerificationResult = "pass" | "needs_review" | "fail";
export type VerificationStatus = "sufficient" | "partial" | "insufficient";

export type AnswerModality = "text" | "voice";
export type TranscriptionProviderName = "stub" | "openai";

export type VerificationAnswer = {
  questionId: string;
  answer: string;
  /** D-048: per-answer modality. Defaults to "text" when absent. */
  modality?: AnswerModality;
  /** SHA-256 of `answer` text when modality === "voice". */
  transcriptHash?: string | null;
  transcriptionProvider?: TranscriptionProviderName | null;
  transcriptionModel?: string | null;
  /** True when the student edited the transcript before submitting. */
  transcriptEdited?: boolean;
};

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
  /** D-048: true when at least one answer has modality === "voice". */
  hasVoiceAnswers: boolean;
  // D-041: reference pin (nullable).
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

export type CreateConceptCheckVerificationInput = {
  answers: VerificationAnswer[];
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

export type DashboardRowStatus =
  | "submitted_no_checks"
  | "checks_no_verification"
  | "pass"
  | "needs_review"
  | "fail";

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
  /** D-048: surfaces whether any answer in this attempt was a voice transcript. */
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
  conceptCheckSets: EvidenceReportConceptCheckSet[]; // newest-first
  verificationAttempts: EvidenceReportVerificationAttempt[]; // newest-first; ALL attempts
  provenance: EvidenceReportProvenance;
};

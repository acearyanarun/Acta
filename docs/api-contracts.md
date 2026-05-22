# API Contracts

**Purpose:** Endpoint definitions, request/response schemas, and auth model for Acta.
Tiebreaker for inter-agent interface disputes.
**Owner:** software-architect-agent
**Last updated:** 2026-05-10
**Status:** Active — Assignments resource defined (D-016–D-021)

---

## Auth model (foundation + this feature)

Placeholder header auth (D-020). Real auth provider is DEFERRED L3.

Required on every route except `/healthz`:
- `X-Acta-Tenant-Id: <tenant ulid or slug>`
- `X-Acta-Instructor-Id: <instructor id>`

Missing → `401 { "error": "unauthorized", "message": "..." }`. Body values for tenant/instructor are ignored.

---

## Common shapes

```ts
type VerificationMode = "score" | "gate" | "fail_only";

type AiHelpPolicy = {
  conceptExplanation: boolean;
  hints: boolean;
  examples: boolean;
  debuggingGuidance: boolean;
  restrictFinalAnswer: boolean;   // hard policy requirement; enforcement deferred (D-021)
};

type AssignmentPolicyVersion = {
  id: string;              // policyVersionId (ULID)
  assignmentId: string;
  tenantId: string;
  instructorId: string;
  version: number;
  title: string;
  instructions: string;
  rubric: string | null;
  aiHelp: AiHelpPolicy;
  verificationMode: VerificationMode;
  policyHash: string;
  createdAt: string;       // ISO-8601
};

type Assignment = {
  id: string;
  tenantId: string;
  instructorId: string;
  currentVersion: number;
  policy: AssignmentPolicyVersion;   // current version joined in
  createdAt: string;
  updatedAt: string;
};

type CreateAssignmentInput = {
  title: string;
  instructions: string;
  rubric?: string | null;
  aiHelp: AiHelpPolicy;
  verificationMode: VerificationMode;
};
```

---

## Endpoints — Assignments

### `GET /v1/assignments`
List assignments for `(tenantId, instructorId)` derived from headers.
- **200** `{ items: Assignment[] }` — each item has its current policy version joined
- **401** missing headers

### `POST /v1/assignments`
Create a new assignment with version 1.
- **Request:** `CreateAssignmentInput`
- **201** `Assignment`
- **400** validation error
- **401** missing headers

### `GET /v1/assignments/:id`
Default returns current version.
- Optional query: `?version=N` to return a specific historical version
- **200** `Assignment` (with `policy = current` or `policy = version N`)
- **404** unknown id OR cross-tenant access OR unknown version
- **401** missing headers

### `GET /v1/assignments/:id/versions`
List the immutable version history.
- **200** `{ items: AssignmentPolicyVersion[] }` sorted `version DESC`
- **404** unknown id OR cross-tenant
- **401** missing headers

### `PUT /v1/assignments/:id`
Create a new policy version and advance `current_version`.
- **Request:** `CreateAssignmentInput`
- **200** `Assignment` (policy is the new version)
- **400** validation error
- **404** unknown id OR cross-tenant
- **401** missing headers

> No row in `assignment_policy_versions` is ever updated or deleted (D-018). PUT inserts a new row.

### Out of scope (return 501 for now)

- `DELETE /v1/assignments/:id`
- Transfer ownership / share
- Submissions, concept checks, ledger reads, exports

---

## Endpoints — Student guided-help

### `GET /v1/student/assignments`
List all assignments for the caller's tenant (no instructor filter).
Auth: `X-Acta-Tenant-Id` + `X-Acta-Student-Id` (instructor header also accepted).
- **200** `{ items: Assignment[] }` — current policy version joined per row
- **401** missing headers

### `GET /v1/student/assignments/:id`
- **200** `Assignment` (current policy)
- **404** unknown id OR cross-tenant
- **401** missing headers

### `POST /v1/assignments/:id/help`
Request guided help for an assignment. Stateless: the frontend sends the full conversation.

**Request:**
```ts
{
  messages: Array<{ role: "student" | "assistant"; content: string }>;
  requestType?: "hint" | "explanation" | "example" | "debugging" | "general";
}
```

**Response (200):**
```ts
{
  assistantMessage: { role: "assistant"; content: string };
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  policyApplied: AiHelpPolicy;
  outcome: "answered" | "refused" | "redirected";
  outcomeReason?: string;   // present when outcome is refused or redirected
  provider: "stub" | "anthropic";
}
```

**Errors:**
- `400 help_type_not_allowed` — `requestType` is disallowed by the assignment's current policy. No AI call is made.
- `400 validation_failed` — empty messages, malformed roles, etc.
- `401 unauthorized` — missing tenant or student/instructor header
- `404 not_found` — unknown assignment OR cross-tenant

Out of scope (501): persistent chat sessions, message history endpoints.

---

## Endpoints — Submissions

Shapes:

```ts
type Submission = {
  id: string;
  tenantId: string;
  assignmentId: string;
  studentId: string;
  policyVersionId: string;     // snapshot of the assignment's current policy at submission time (frozen)
  policyVersion: number;
  policyHash: string;
  content: string;
  contentHash: string;         // SHA-256 hex of content
  submittedAt: string;         // ISO-8601
};

type CreateSubmissionInput = { content: string };
```

### `POST /v1/assignments/:id/submissions`
Student-only. Append-only — every call creates a new row (D-027).
- **Auth:** requires `X-Acta-Tenant-Id` + `X-Acta-Student-Id`. If `X-Acta-Instructor-Id` is the only identity, returns `403 student_only`.
- **Request:** `{ content: string }` (1..200_000 chars, D-028)
- **Response 201:** `Submission` with snapshot fields filled from current policy
- **Errors:** `400 validation_failed`, `401 unauthorized`, `403 student_only`, `404 not_found` (unknown assignment or cross-tenant)

### `GET /v1/assignments/:id/submissions`
- **Auth:** student or instructor
- **Filter:**
  - Instructor: returns ALL submissions for the assignment in the tenant.
  - Student: returns ONLY their own submissions for that assignment.
- **Response 200:** `{ items: Submission[] }` sorted `submittedAt DESC`
- **Errors:** `401`, `404` (unknown assignment, cross-tenant)

### `GET /v1/submissions/:id`
- **Auth:** student or instructor
- **Filter:**
  - Instructor: any submission in their tenant.
  - Student: only their own.
  - A student requesting another student's submission within the same tenant → `404` (D-019 pattern).
- **Response 200:** `Submission`
- **Errors:** `401`, `404`

Out of scope: delete, list-by-student-across-assignments, bulk export.

---

## Endpoints — Concept checks

Shapes:

```ts
type ConceptCheckQuestion = {
  id: string;          // ULID
  ordinal: number;     // 1-based display order
  prompt: string;      // 5..400 chars
  conceptTag?: string; // optional short label, 1..40 chars
};

type ConceptCheckSet = {
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
  provider: "stub" | "anthropic";
  model: string | null;
  generatedAt: string;
  // D-041: reference pin. Non-null when an Instructor Solution Guide existed for
  // the assignment at generation time. Null on rows generated before this feature
  // shipped, and on rows generated when no reference exists.
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

type GenerateConceptChecksInput = {
  questionCount?: number;     // 1..8, default 4 (D-030)
};
```

### `POST /v1/submissions/:id/concept-checks`
Generate a new immutable set (D-031).
- **Auth:** student only AND student must own the submission. Instructor → 404 (not 403, matches privacy semantics).
- **Request:** `GenerateConceptChecksInput` (optional)
- **Response 201:** `ConceptCheckSet` with snapshot fields from the submission
- **Errors:** `400 validation_failed`, `401`, `404`

### `GET /v1/submissions/:id/concept-checks`
- **Auth:** student (own submission only) OR instructor (any submission in tenant).
- **Response 200:** `{ items: ConceptCheckSet[] }` sorted `generatedAt DESC`
- **Errors:** `401`, `404`

### `GET /v1/concept-check-sets/:id`
- **Auth:** student (must own underlying submission) OR instructor (any in tenant).
- **Errors:** `401`, `404`

Out of scope: answer capture, scoring, regenerate-replacing semantics.

---

## Endpoints — Concept-check verifications

Shapes:

```ts
type VerificationResult = "pass" | "needs_review" | "fail";
type VerificationStatus = "sufficient" | "partial" | "insufficient";

type Answer = { questionId: string; answer: string };
type PerQuestionFeedback = { questionId: string; status: VerificationStatus; feedback: string };

type ConceptCheckVerification = {
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
  answers: Answer[];
  result: VerificationResult;
  overallFeedback: string;
  perQuestionFeedback: PerQuestionFeedback[];
  provider: "stub" | "anthropic";
  model: string | null;
  evaluatedAt: string;
  // D-041: reference pin (nullable).
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

type CreateConceptCheckVerificationInput = { answers: Answer[] };
```

### `POST /v1/concept-check-sets/:id/verifications`
Create an immutable verification attempt (D-033).
- **Auth:** student only AND student must own the set. Instructor → 404.
- **Request:** `{ answers: Answer[] }` with one entry per set question; non-empty (1..5000 chars, D-034); no duplicate `questionId`; no unknown `questionId`.
- **Response 201:** `ConceptCheckVerification` with snapshot fields from the set
- **Errors:** `400 validation_failed`, `400 missing_answers`, `400 unknown_question_id`, `400 duplicate_question_id`, `401`, `404`

### `GET /v1/concept-check-sets/:id/verifications`
- **Auth:** student (own only) OR instructor (any in tenant).
- **Response 200:** `{ items: ConceptCheckVerification[] }` sorted `evaluatedAt DESC`
- **Errors:** `401`, `404`

### `GET /v1/verifications/:id`
- **Auth:** student (own only) OR instructor (any in tenant). Cross-tenant → 404.
- **Errors:** `401`, `404`

Out of scope: answer replacement, course-grade derivation, gradebook integration.

---

## Endpoints — Instructor reference solutions

Shapes:

```ts
type ReferenceSolution = {
  id: string;
  tenantId: string;
  assignmentId: string;
  instructorId: string;
  version: number;
  expectedSolution: string;
  keyConcepts: string[];           // order preserved (D-040)
  requiredReasoningSteps: string[];
  commonMistakes: string[];
  correctnessCriteria: string;
  optionalNotes: string | null;
  referenceHash: string;
  createdAt: string;
};

type CreateReferenceSolutionInput = {
  expectedSolution: string;
  keyConcepts: string[];
  requiredReasoningSteps: string[];
  commonMistakes: string[];
  correctnessCriteria: string;
  optionalNotes?: string | null;
};
```

All three routes are **instructor-only**. Students get `404` (privacy pattern D-019), never `403`.

### `GET /v1/assignments/:id/reference-solution`
- Returns the current (highest-version) reference solution.
- **404** if no version exists yet; if cross-tenant; if student attempts.

### `POST /v1/assignments/:id/reference-solution`
- Creates a new immutable version (D-038). `version = max(prev) + 1` or `1` if first.
- **Request:** `CreateReferenceSolutionInput` — body limits per D-039:
  - `expectedSolution` ≤ 50,000 chars
  - `correctnessCriteria` ≤ 10,000 chars
  - `optionalNotes` ≤ 10,000 chars (nullable)
  - `keyConcepts` ≤ 50 entries × ≤ 200 chars
  - `requiredReasoningSteps` ≤ 50 entries × ≤ 400 chars
  - `commonMistakes` ≤ 50 entries × ≤ 400 chars
- **201** `ReferenceSolution` with computed `referenceHash`
- **400** `validation_failed`; **401**; **404** for non-instructor / cross-tenant

### `GET /v1/assignments/:id/reference-solution/versions[?version=N]`
- Without `?version`: `{ items: ReferenceSolution[] }` sorted version DESC.
- With `?version=N`: single historical row, or 404 if unknown.

Out of scope: editing in place, version pruning, deletion, student access.

---

## Endpoints — Evidence export (read-only assembly)

### `GET /v1/submissions/:id/evidence-report`
Returns a structured JSON report assembled from already-stored rows for a single
submission. Instructor-only. Pure read. No AI invocation. No ledger emission.
No schema change.

Auth + privacy:
- No auth headers → 401 `unauthorized`.
- Student-only auth → 404 `not_found` (D-019: instructor-only routes never reveal existence).
- Cross-tenant instructor → 404 (the submissions repo's tenant gate).
- Unknown submission id → 404.
- Same-tenant instructor → 200 with `EvidenceReport`.

Response shape:
```ts
type EvidenceReport = {
  generatedAt: string;
  assignment: {
    id: string;
    title: string;
    instructions: string;
    rubric: string | null;
  };
  policy: {
    policyVersionId: string;     // pinned to the submission's policy version
    policyVersion: number;
    policyHash: string;
    aiHelp: AiHelpPolicy;
    verificationMode: VerificationMode;
  };
  referenceSolution: ReferenceSolution | null; // current reference for the assignment at report time
  submission: {
    id: string;
    studentId: string;
    submittedAt: string;
    content: string;
    contentHash: string;
    policyVersionId: string;
    policyVersion: number;
    policyHash: string;
  };
  conceptCheckSets: Array<{
    id: string;
    generatedAt: string;
    provider: "stub" | "anthropic";
    model: string | null;
    referenceSolutionId: string | null;  // D-041 pin captured at generation time
    referenceVersion: number | null;
    referenceHash: string | null;
    questions: ConceptCheckQuestion[];
  }>; // newest-first
  verificationAttempts: Array<{
    id: string;
    conceptCheckSetId: string;
    result: "pass" | "needs_review" | "fail";
    overallFeedback: string;
    answers: VerificationAnswer[];
    perQuestionFeedback: PerQuestionFeedback[];
    provider: "stub" | "anthropic";
    model: string | null;
    referenceSolutionId: string | null;  // D-041 pin captured at evaluation time
    referenceVersion: number | null;
    referenceHash: string | null;
    evaluatedAt: string;
  }>; // newest-first; ALL attempts included
  provenance: {
    policyHash: string;
    referenceHash: string | null;  // current reference at report time
    contentHash: string;
    latestConceptCheckReferenceHash: string | null; // pin on the newest set
    latestVerificationReferenceHash: string | null; // pin on the newest attempt
  };
};
```

Assembly rules:
- Assignment policy is loaded at the EXACT version pinned on the submission
  (`assignmentsRepo.getByTenantIdVersion(tenantId, assignmentId, policyVersion)`),
  so historical submissions render the policy text that was active at submit time.
- `referenceSolution` is the CURRENT reference for the assignment at
  report-generation time. Per-row reference pins on sets and verifications
  preserve the historical anchor that was active at generation/evaluation time.
- `verificationAttempts` includes ALL attempts for ALL sets on the submission,
  newest-first. No truncation at MVP scale.
- If no concept-check set exists, `conceptCheckSets: []`.
- If no verification attempt exists, `verificationAttempts: []`.
- No reserved ledger event is emitted by this endpoint. The report is a pure read.

Frontend route: `/submissions/[id]/evidence-report`. Client-only printable page.
"Print / Save as PDF" button uses `window.print()`. Server-side PDF generation
is intentionally deferred for the POC.

---

## Endpoints — Instructor dashboard (read-only aggregation)

### `GET /v1/instructor/dashboard`
Returns a tenant-scoped, read-only summary for the instructor's Teacher Review
Dashboard. Pure aggregation over existing rows (assignments, submissions, concept-
check sets, concept-check verifications). No write side effects. No AI providers
invoked. Reference pin fields (D-041) on sets/verifications flow through unchanged.

Auth + privacy (D-046):
- No auth headers → 401 `unauthorized`.
- Student-only auth → 404 `not_found` (instructor-only route; D-019 pattern).
- Instructor with empty tenant → 200 with zero counts and empty arrays (matches
  the tenant-scoped pattern already used by `GET /v1/student/assignments`; does
  not leak whether other tenants have data).

Caps and limits:
- Source fetches are bounded server-side: submissions ≤ 500, concept-check sets ≤ 1000,
  verifications ≤ 1000 (most-recent-first by their respective timestamps).
- Output is then capped per-section: `needsAttention` ≤ 50 rows, `recentSubmissions` ≤ 20
  rows, `recentVerifications` ≤ 20 rows.

Response shape:
```ts
type DashboardSummary = {
  totalAssignments: number;
  totalSubmissions: number;
  pendingConceptChecks: number;   // submissions whose latest state is "submitted_no_checks"
  pendingVerification: number;    // submissions whose latest set has no verification attempt
  passed: number;                 // submissions whose latest attempt result === "pass"
  needsReview: number;
  failed: number;
};

type NeedsAttentionStatus =
  | "submitted_no_checks"
  | "checks_no_verification"
  | "needs_review"
  | "fail";

type NeedsAttentionRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  studentId: string;
  status: NeedsAttentionStatus;
  latestVerificationResult: "pass" | "needs_review" | "fail" | null;
  submittedAt: string;
  lastActivityAt: string;         // max(submittedAt, latestSet.generatedAt?, latestAttempt.evaluatedAt?)
  reviewUrl: string;              // "/submissions/<id>?role=instructor"
};

type RecentSubmissionRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  studentId: string;
  policyVersion: number;
  policyHash: string;
  referenceVersion: number | null; // from latest set on the submission (D-041)
  referenceHash: string | null;
  submittedAt: string;
  reviewUrl: string;
};

type RecentVerificationRow = {
  assignmentId: string;
  assignmentTitle: string;
  submissionId: string;
  conceptCheckSetId: string;
  verificationId: string;
  studentId: string;
  result: "pass" | "needs_review" | "fail";
  provider: "stub" | "anthropic";
  model: string | null;
  referenceVersion: number | null; // D-041 pin on the verification row
  referenceHash: string | null;
  evaluatedAt: string;
  reviewUrl: string;
};

type InstructorDashboard = {
  summary: DashboardSummary;
  needsAttention: NeedsAttentionRow[];     // oldest lastActivityAt first
  recentSubmissions: RecentSubmissionRow[]; // newest submittedAt first
  recentVerifications: RecentVerificationRow[]; // newest evaluatedAt first
};
```

Status resolution per submission (latest-wins):
1. No concept-check set on the submission → `submitted_no_checks`.
2. Latest set exists but has no verification attempt → `checks_no_verification`.
3. Latest set has at least one attempt → use the latest attempt's `result`
   (`pass` / `needs_review` / `fail`).

`pass` rows do not appear in `needsAttention`. They are counted in `summary.passed`
and can still appear in `recentSubmissions` / `recentVerifications`.

Repo dependency: this route is the only caller of the tenant-wide read methods
(D-045): `submissionsRepo.listByTenantAcrossAssignments`,
`conceptCheckSetsRepo.listByTenantAcrossSubmissions`,
`conceptCheckVerificationsRepo.listByTenantAcrossSets`. Those methods take no
`studentId` parameter — the route layer enforces instructor context before
calling them.

No reserved ledger event for this endpoint. It is a pure read; nothing is
recorded as a ledger anchor.

---

## Reserved ledger events (not yet emitted)

```ts
type AssignmentPolicyCreatedEvent = {
  type: "assignment.policy.created";
  tenantId: string;
  assignmentId: string;
  policyVersionId: string;   // ULID of immutable version row
  policyVersion: 1;
  policyHash: string;
  instructorId: string;
  occurredAt: string;
};

type AssignmentPolicyUpdatedEvent = {
  type: "assignment.policy.updated";
  tenantId: string;
  assignmentId: string;
  policyVersionId: string;
  policyVersion: number;
  previousPolicyVersionId: string;
  previousPolicyHash: string;
  policyHash: string;
  instructorId: string;
  occurredAt: string;
};

type ChatSessionStartedEvent = {
  type: "chat.session.started";
  tenantId: string;
  assignmentId: string;
  sessionId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  occurredAt: string;
};

type ChatMessageEvent = {
  type: "chat.message";
  tenantId: string;
  assignmentId: string;
  sessionId: string;
  messageId: string;
  role: "student" | "assistant";
  contentHash: string;          // SHA-256 hex of message content
  policyVersionId: string;
  policyHash: string;
  occurredAt: string;
};

type ChatPolicyDriftEvent = {
  type: "chat.policy.drift";
  tenantId: string;
  assignmentId: string;
  sessionId: string;
  previousPolicyVersionId: string;
  currentPolicyVersionId: string;
  occurredAt: string;
};

type ConceptCheckSetCreatedEvent = {
  type: "concept_check_set.created";
  tenantId: string;
  assignmentId: string;
  submissionId: string;
  conceptCheckSetId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  submissionContentHash: string;        // raw content NEVER appears in this event
  questionCount: number;
  provider: "stub" | "anthropic";
  model: string | null;
  occurredAt: string;
  // D-041: reference anchors (nullable). Raw expectedSolution / keyConcepts /
  // requiredReasoningSteps / commonMistakes / correctnessCriteria / optionalNotes
  // are NEVER in this event.
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

type AssignmentReferenceSolutionCreatedEvent = {
  type: "assignment_reference_solution.created";
  tenantId: string;
  assignmentId: string;
  referenceSolutionId: string;
  version: number;
  referenceHash: string;           // raw expectedSolution / keyConcepts / criteria / notes NEVER in this event
  instructorId: string;
  occurredAt: string;
};

type ConceptCheckVerificationCreatedEvent = {
  type: "concept_check_verification.created";
  tenantId: string;
  assignmentId: string;
  submissionId: string;
  conceptCheckSetId: string;
  verificationId: string;
  studentId: string;
  policyVersionId: string;
  policyVersion: number;
  policyHash: string;
  submissionContentHash: string;       // raw content NEVER in this event
  result: "pass" | "needs_review" | "fail";
  provider: "stub" | "anthropic";
  model: string | null;
  occurredAt: string;
  // D-041: reference anchors (nullable). Raw answers / feedback / reference
  // content are NEVER in this event.
  referenceSolutionId: string | null;
  referenceVersion: number | null;
  referenceHash: string | null;
};

type SubmissionCreatedEvent = {
  type: "submission.created";
  tenantId: string;
  assignmentId: string;
  submissionId: string;
  studentId: string;
  policyVersionId: string;     // immutable anchor to assignment_policy_versions row
  policyVersion: number;
  policyHash: string;
  contentHash: string;         // SHA-256 hex; raw content NEVER in ledger events (D-029)
  occurredAt: string;
};
```

Recorded in shape only. No ledger emission in this feature.

---

## Error format

```json
{ "error": "<machine_code>", "message": "<human readable>" }
```

Machine codes used: `unauthorized`, `validation_failed`, `not_found`, `not_implemented`,
`ai_help_disabled` (D-047 — `POST /v1/assignments/:id/help` when the policy version has
`aiHelpEnabled === false`; returned as `400`; never invokes the AI provider; payload
includes `policyVersionId`, `policyVersion`, `policyHash`),
`help_type_not_allowed` (D-025 — per-type help guard).

---

## Versioning

URL-prefixed: `/v1/`. Breaking changes require a new prefix (`/v2/`).

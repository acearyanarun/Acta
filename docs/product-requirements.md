# Product Requirements

**Purpose:** Full requirements for Acta verification MVP with acceptance criteria.
**Owner:** product-manager-agent
**Last updated:** 2026-05-05
**Status:** Draft — blocked until MVP scope is founder-approved in docs/decisions.md

---

## Pre-condition

This document must not be populated until docs/mvp-scope.md is founder-approved.

---

## Core requirements (pre-approved by hard constraints — cannot be removed without waiver)

### R1 — Async concept-check generation (from C1, C2, C3)
Requirement: After a student submits work, the system generates a short set of concept
checks derived from that specific submission.
Acceptance criteria: _To be defined_

### R2 — Three grading modes (from C3)
Requirement: The instructor selects one of three modes per assignment:
1. Confidence score (informational)
2. Required gate (must pass to receive credit)
3. Fail-only escalation (triggered only if check fails)
Acceptance criteria: _To be defined_

### R3 — Cryptographically signed ledger (from C2)
Requirement: Every verification interaction is recorded in an append-only, tamper-evident,
cryptographically signed ledger. The ledger must be exportable for appeal and accreditation review.
Acceptance criteria: _To be defined_

### R4 — Instructor configuration UI (from C6)
Requirement: Instructors can configure grading mode per assignment with minimal friction.
Acceptance criteria: Setup for a new assignment completes in under 5 minutes.

#### R11 — Evidence export (feature: evidence-export, 2026-05-11)
Instructor-only, read-only structured report that summarizes everything Acta already stores for a single submission: assignment policy snapshot, Instructor Solution Guide snapshot, student submission, concept-check sets, all verification attempts, and provenance/hash pins. POC export format is a printable HTML page (`window.print()` covers PDF). No server-side PDF dependency.

Acceptance criteria:
1. New endpoint `GET /v1/submissions/:id/evidence-report` returns the `EvidenceReport` shape in docs/api-contracts.md.
2. Privacy: 401 no auth; 404 student-only auth; 404 cross-tenant instructor; 404 unknown submission. Same-tenant instructor → 200.
3. Assignment policy is loaded at the EXACT version pinned on the submission (uses `assignmentsRepo.getByTenantIdVersion`), so historical submissions render the policy text active at submit time.
4. `referenceSolution` field is the CURRENT reference for the assignment at report-generation time; per-row reference pins on sets and verifications preserve the EXACT historical anchor used at generation / evaluation time.
5. ALL verification attempts are included, newest-first. No truncation at MVP scale.
6. If no concept-check set exists, `conceptCheckSets: []`. If no verification exists, `verificationAttempts: []`. If no reference exists, `referenceSolution: null` and `provenance.referenceHash: null`.
7. The endpoint does NOT invoke any AI provider (help, concept-check, or verification). It does NOT emit a ledger event. No schema change.
8. Frontend page `/submissions/[id]/evidence-report` renders the 8-section printable report and exposes a `Print / Save as PDF` button. The page is instructor-only by API gate; 404 renders an empty "not available" state.
9. Entry points added: `→ Open evidence report` on `/submissions/[id]?role=instructor`; conditional `Evidence report` action link on dashboard rows where a verification attempt exists. Student workspace and top nav are not modified.
10. Banned language is absent from every new file: `legally admissible`, `legal proof`, `court-ready`, `guaranteed integrity`, `AI detection` (the approved disclaimer explicitly negates the claim of AI-detection).
11. Server-side PDF generation is intentionally deferred. No new dependency on `puppeteer` / `pdfkit` / `react-pdf`.

#### R10 — Basic Teacher Review Dashboard (feature: basic-teacher-review-dashboard, 2026-05-11)
Instructor-only read-only aggregation page at `/instructor/dashboard` that surfaces, in a single screen, the tenant's totals, the queue of submissions that need follow-up, and the most recent submissions and verification attempts. Pure aggregation over existing rows — no schema change, no AI invocation, no ledger emission.

Acceptance criteria:
1. New endpoint `GET /v1/instructor/dashboard` returns `{ summary, needsAttention, recentSubmissions, recentVerifications }` as specified in docs/api-contracts.md.
2. Privacy semantics (D-046): 401 on no auth; 404 on student-only auth; 200 with zero counts + empty arrays for instructor on an empty tenant.
3. Per-submission status is latest-wins: no sets → `submitted_no_checks`; latest set without attempts → `checks_no_verification`; otherwise the latest attempt's `result`. `pass` is excluded from `needsAttention`.
4. Output caps: `needsAttention ≤ 50` (sorted oldest `lastActivityAt` first), `recentSubmissions ≤ 20` and `recentVerifications ≤ 20` (newest-first).
5. Source fetches are bounded server-side (≤ 500 submissions / ≤ 1000 sets / ≤ 1000 verifications) so the aggregator stays fast for large tenants.
6. Reference pin fields (D-041) flow through unchanged on both `recentSubmissions` rows (from the latest set on the submission) and `recentVerifications` rows.
7. Each row carries a `reviewUrl` of `/submissions/<id>?role=instructor` — no new review surface is introduced.
8. Three new repo methods (D-045) — `submissionsRepo.listByTenantAcrossAssignments`, `conceptCheckSetsRepo.listByTenantAcrossSubmissions`, `conceptCheckVerificationsRepo.listByTenantAcrossSets` — are tenant-wide reads only, with no `studentId` parameter. Implemented identically in memory + pg pairs.
9. Frontend page at `/instructor/dashboard` renders the four sections, with `Review dashboard` CTA on `/instructor` and `→ Open Review Dashboard` back-row link on `/instructor/[id]`. No top-nav entry; student workspace untouched.
10. The dashboard route does NOT invoke any AI provider (`postHelp`, concept-check generation, verification grading). No reserved ledger event for this endpoint.

#### R9 — Reference-RAG retrieval into concept-check + verification (feature: reference-rag-retrieval, 2026-05-11)
Concept-check generation and text-verification grading retrieve the current Instructor
Solution Guide for the assignment (when one exists) and inject it as a trusted block in
the evaluator prompt. Strictly additive: tenants with no reference get the prior behavior.

Acceptance criteria:
1. POST `/v1/submissions/:id/concept-checks` calls `referenceSolutionsRepo.getCurrentByAssignment(...)` and passes the result through to the prompt builder, the provider, and the persistence layer.
2. POST `/v1/concept-check-sets/:id/verifications` does the same.
3. When a reference exists, the prompt builders emit an `<<<INSTRUCTOR-REFERENCE-START` / `INSTRUCTOR-REFERENCE-END>>>` trusted block ABOVE the submission block (D-042). The student submission and Q/A blocks remain wrapped as untrusted data (D-037).
4. When no reference exists, prompts retain their existing shape (strictly-additive fallback, D-043).
5. New rows persist `referenceSolutionId`, `referenceVersion`, `referenceHash` (D-041) — NULL when no reference existed at the time.
6. Existing rows from before this feature retain NULL across the three new columns; no backfill.
7. Students still cannot access reference solution routes (regression: 404).
8. Reserved ledger events for both `concept_check_set.created` and `concept_check_verification.created` gain the three nullable anchor fields. Raw instructor content, raw student content, raw answers, raw question prompts, and raw feedback remain excluded.
9. The stub providers visibly reflect reference usage in a minimal way (D-044) — concept-check stub prepends a key-concept question; verification stub appends an annotation line to `overallFeedback`. Aggregation rules unchanged.
10. No vector DB, no embeddings, no chunking, no external RAG service.

#### R8 — Instructor Solution Guide / reference RAG (feature: instructor-reference-rag, 2026-05-11)
Instructors can author a trusted reference solution per assignment. Stored as append-only
versions so future verification rows can pin the exact reference used at evaluation time.
This feature STORES and DOCUMENTS the trusted/untrusted boundary only. It does NOT modify
concept-check or verification prompts.

Acceptance criteria:
1. Three instructor-only routes: `GET /v1/assignments/:id/reference-solution`,
   `POST /v1/assignments/:id/reference-solution`,
   `GET /v1/assignments/:id/reference-solution/versions[?version=N]`. Students attempting any
   of them → 404 (D-019 privacy semantics).
2. POST creates a new immutable version (D-038); the app never UPDATEs/DELETEs rows.
   "Current" = `ORDER BY version DESC LIMIT 1` (no `current_version` pointer column).
3. Body fields are validated per D-039 (size and count limits). Empty/whitespace-only
   required text fields are rejected.
4. Each row carries a deterministic `referenceHash` = SHA-256 hex over canonical JSON
   (D-040). List fields preserve order — reordering changes the hash.
5. The repo interface exposes only `createNextVersion`, `getCurrentByAssignment`,
   `getByVersion`, `listVersionsByAssignment`. It does NOT accept a `studentId` parameter.
6. Cross-tenant access returns 404.
7. The reserved ledger event `assignment_reference_solution.created` contains only ids,
   `version`, `referenceHash`, `instructorId`, `occurredAt` — never raw `expectedSolution`,
   `keyConcepts`, `correctnessCriteria`, or `optionalNotes`.
8. No prompt builder or AI provider is modified by this feature. Retrieval into prompts is
   the scope of a follow-up feature: `reference-rag-retrieval`.
9. UI surface appears only on `/instructor/[id]`. No student-facing page imports the
   reference-solution component.

#### R7 — Text-verification grading signal (feature: text-verification-grading, 2026-05-11)
After concept checks are generated, the student can answer them and receive a verification
SIGNAL (`pass | needs_review | fail`). This is NOT final grading; it is a flag for
instructor review.

Acceptance criteria:
1. POST `/v1/concept-check-sets/:id/verifications` is student-owner-only. Other callers → 404 (D-019).
2. Validation rejects missing answers, unknown question IDs, duplicate question IDs, empty
   or whitespace-only answers, and answers > 5,000 chars (D-034).
3. Each row freezes `conceptCheckSetId`, `submissionId`, `policyVersionId`, `policyVersion`,
   `policyHash`, `submissionContentHash`, `provider`, `model`, `evaluatedAt`.
4. `result` is strictly one of `pass | needs_review | fail` at DB (CHECK), API (zod), and TS.
5. Stub evaluator (no API key) is deterministic per `(answers, conceptCheckSetId)` and
   follows D-035 thresholds.
6. Anthropic evaluator is gated on `ANTHROPIC_API_KEY` and applies the D-036 conservative
   downgrade rule when output is incomplete.
7. Re-submission appends a new row (D-033). Prior rows remain queryable. No UPDATE / DELETE.
8. Student-A cannot read or POST against Student-B's set or verification. Cross-tenant → 404.
9. Instructor can list/read attempts for any submission in tenant; cannot POST.
10. Future ledger event `concept_check_verification.created` contains hashes/ids/result/
    provider/model/timestamp only — never raw answers, raw feedback, raw submission content,
    or raw question prompts.

#### R6 — Submission-grounded concept checks (feature: submission-grounded-concept-checks, 2026-05-11)
After a student submits work, the system can generate concept-check questions that probe
understanding of THEIR specific submission. Sets are immutable, append-only, and anchored
to the policy version and submission content hash at generation time. No grading or scoring
in this feature.

Acceptance criteria:
1. POST `/v1/submissions/:id/concept-checks` is student-owner-only. Other callers → 404 (D-019).
2. Questions are generated against the submission content and the policy version pinned
   on the submission (not the current policy, if it has since drifted).
3. Each set row freezes: `submissionId`, `policyVersionId`, `policyVersion`, `policyHash`,
   `submissionContentHash`, `provider`, `model`, `generatedAt`.
4. Stub provider (no API key) is deterministic per `(submissionContentHash, questionCount)`.
   Real Anthropic provider activates when `ANTHROPIC_API_KEY` is set (D-022).
5. Default `questionCount = 4`; range 1..8 (D-030). Out-of-range → 400.
6. Re-generation appends a new set; prior sets remain queryable (D-031). No UPDATE/DELETE.
7. Student-A cannot read or generate against Student-B's submission. Cross-tenant → 404.
8. Instructor can list/read sets for any submission in tenant. Cannot POST (404).
9. Future ledger event `concept_check_set.created` contains hashes/ids/counts only — never
   raw content or raw question prompts.

#### R5 — Student submission capture (feature: student-submission, 2026-05-10)
Student can submit text work for an assignment. The system pins the assignment's current
policy snapshot to the submission row at write time. Re-submission creates a new row;
prior submissions remain queryable. Instructor can list all submissions for the assignment
in the tenant. Student sees only their own.

Acceptance criteria:
1. POST submission requires student auth. Instructor POST returns 403 `student_only`.
2. Submission row carries `policyVersionId`, `policyVersion`, `policyHash`, `contentHash`, `submittedAt`.
3. Submission is immutable: no UPDATE/DELETE in app code (D-027).
4. After instructor policy bump, new submissions capture the new pin; old submissions keep their original pin.
5. Cross-tenant access returns 404. Student A reading Student B's submission in the same tenant returns 404 (not 403).
6. UI: student can submit, view their own list, view a single submission. Instructor can view the assignment's full list.
7. No real student data; D-003 synthetic-only guard remains in force.
8. No ledger writes; the future `submission.created` event uses `contentHash` only (D-029).

#### R4.1 — Teacher assignment policy (feature: teacher-assignment-policy, 2026-05-10)
Instructor can create, view, list, and update an assignment policy that includes:
- Title (required), instructions (required), optional rubric
- AI help policy (concept explanation, hints, examples, debugging guidance, restrict final answer)
- Verification mode (score / gate / fail_only)

Acceptance criteria:
1. Instructor can create a new assignment policy via UI in under 2 minutes (C6).
2. All five AI help toggles are captured and displayed clearly. `restrictFinalAnswer` is shown as a hard policy requirement (D-021).
3. Verification mode selection uses a radio-card group with the three approved options (C3).
4. Updates create a new immutable policy version; previous versions remain on record (D-018).
5. The current version is returned by default; historical versions are queryable via `?version=N` and `/versions`.
6. Cross-tenant access to any policy or version returns 404 (D-019).
7. The policy `policyHash` is stable across reads and changes whenever the version body changes.
8. No real student data is used or accepted (D-003). No ledger writes occur in this feature (deferred).

---

## Conditional requirements

_To be populated after MVP scope is approved and Q4/Q5/Q6 are resolved._

---

## Out of scope (see docs/not-building.md)

_To be populated by product-manager-agent._

---

## Open questions for founder

_To be completed by product-manager-agent._

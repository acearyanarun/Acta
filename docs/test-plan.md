# Test Plan

**Purpose:** Full test coverage plan for Acta verification MVP.
**Owner:** qa-security-devops-agent
**Last updated:** 2026-05-10
**Status:** Foundation smoke section active. Product feature test plans pending.

---

## Foundation smoke checks (D-014)

Acceptance gate for `/build-feature project-foundation`:

| # | Check | How verified |
|---|-------|--------------|
| F1 | `pnpm install` completes cleanly on a fresh checkout | manual / CI |
| F2 | `pnpm -r typecheck` passes | manual / CI |
| F3 | `pnpm -r lint` passes (Biome) | manual / CI |
| F4 | Frontend starts on port 3000; `GET /healthz` returns 200 | manual / smoke test |
| F5 | Backend starts on port 4000; `GET /healthz` returns 200 with git sha + uptime | manual / smoke test |
| F6 | `scripts/check-foundation.sh` exits 0 | manual / CI |
| F7 | Foundation Vitest suite passes | manual / CI |
| F8 | Synthetic-data guard refuses boot when `ALLOW_REAL_STUDENT_DATA=true` with no DPA reference | Vitest unit test |
| F9 | CI workflow runs on push (lint + typecheck + smoke) | GitHub Actions |
| F10 | `.env.example` exists; `.env` is gitignored; no secrets in tracked files | repo grep |
| F11 | No source file uses the phrase "legally admissible" (D-002 grep guard) | repo grep |
| F12 | No file under `src/ai/` references real student PII | manual review (foundation is empty) |
| F13 | `docker-compose.yml` is labeled "LOCAL DEVELOPMENT ONLY" in a header comment | grep |
| F14 | All placeholder backend routes return 501 (Not Implemented) | smoke test |

---

## Test scope — student-guided-help (D-022–D-026)

Tests live in `tests/student-guided-help.test.ts`.

| Area | Coverage |
|------|----------|
| Prompt builder | title/instructions/rubric verbatim; hard-rule sentence present iff `restrictFinalAnswer = true`; each allowed/not-allowed line correct |
| Stub provider | canned response per `requestType`; refuses + outcomeReason set when restrictFinalAnswer is on AND message has trigger phrase (including under `requestType=general`) |
| Auth | 401 with no headers; 401 with only tenant; either student OR instructor header satisfies |
| Tenant scoping | cross-tenant returns 404 for `:id` and `:id/help`; list returns empty for foreign tenant |
| Policy enforcement | disallowed `requestType` returns 400 `help_type_not_allowed` AND does not invoke the provider |
| Provenance | response includes `policyVersionId` + `policyVersion` + `policyHash`; PUT to v2 surfaces via subsequent help response |
| Outcome semantics | `outcomeReason` present on refused/redirected; absent on answered |
| Student list | `/v1/student/assignments` returns all tenant assignments; `/v1/student/assignments/:id` returns current policy |

## Test scope — student-submission (D-027–D-029)

Tests live in `tests/student-submission.test.ts`.

| Area | Coverage |
|------|----------|
| Content hash | SHA-256 hex; deterministic; 64-char output |
| Validators | rejects empty/whitespace content; rejects > 200,000 chars; accepts 1-char minimum |
| Auth | 401 on missing headers; 403 `student_only` on instructor POST |
| Snapshot | POST captures current `policyVersionId`/`policyVersion`/`policyHash`; FK chain to `assignment_policy_versions` |
| Append-only (D-027) | re-submission produces a new row; prior row remains; no UPDATE/DELETE codepath exists |
| Policy drift | submissions made before PUT keep old pin; new submissions after PUT capture new pin |
| Role filter | instructor lists all; student lists only their own; cross-tenant 404; same-tenant Student-A reading Student-B → 404 (not 403) |
| Single read | unknown id → 404; unknown assignment id on POST → 404 |
| Ledger anchor purity | reserved `submission.created` shape never includes raw content (string `content` is not a field on the event type) |

## Test scope — submission-grounded concept checks (D-030–D-032)

Tests live in `tests/concept-check-generation.test.ts`.

| Area | Coverage |
|------|----------|
| Prompt builder | title/instructions/rubric verbatim; submission wrapped in delimiters; "untrusted data" sentence present; "exactly N" appears; no-detection sentence; prompt-injection text from inside submission appears AFTER the rule that declares the block untrusted (i.e., the model is warned first) |
| Stub provider (D-032) | returns requested N; references submission text; identical prompts across runs given same (contentHash, count) |
| Auth | 401 without headers |
| Privacy (D-019) | unknown id → 404; cross-tenant → 404; Student-A on Student-B's submission → 404 (not 403); instructor POST → 404 |
| Snapshot | response carries submissionId, policyVersionId, policyVersion, policyHash, submissionContentHash matching the submission |
| Bounds (D-030) | questionCount 0 or 9 → 400; default 4 when omitted |
| Append-only (D-031) | regenerate appends; list returns both; repo interface has only create / list / getById |
| Drift integrity | after PUT bumps policy to v2, existing set still references v1's pin |
| Single-set access | instructor in tenant OK; cross-tenant 404; non-owner student 404 |
| Reserved event purity | `concept_check_set.created` shape has no `content`, no `submissionContent`, no `questions`, no `prompt` keys; has `submissionContentHash` and `questionCount` |

## Test scope — text-verification-grading (D-033–D-037)

Tests live in `tests/concept-check-verification.test.ts`.

| Area | Coverage |
|------|----------|
| Validator (D-034) | rejects missing array, empty array, empty answer, whitespace-only answer, > 5,000 chars; accepts well-formed |
| Prompt builder | both submission and Q/A wrapped in distinct delimited untrusted-data blocks; "Never claim to detect AI usage" present; injection text appears AFTER the warning |
| Stub evaluator (D-035) | short answers → `fail`; detailed varied answers → `pass`; mixed quality → `needs_review`; deterministic per `(answers, set)` |
| Auth | 401 missing headers |
| Cross-check | 400 `missing_answers`; 400 `unknown_question_id`; 400 `duplicate_question_id` |
| Privacy (D-019) | unknown set → 404; cross-tenant → 404; Student-A on Student-B's set → 404; instructor POST → 404 |
| Snapshot | response carries `conceptCheckSetId`, `submissionId`, `policyVersionId`, `policyVersion`, `policyHash`, `submissionContentHash` matching the set |
| Result enum | strictly `pass / needs_review / fail` at TS and runtime |
| Append-only (D-033) | multiple POSTs → multiple rows; list returns all; repo interface has no `update`/`delete` |
| Single-row access | owner OK; non-owner student 404; cross-tenant 404; instructor in tenant OK |
| Reserved event purity | shape has no `answers`, `answer`, `overallFeedback`, `perQuestionFeedback`, `feedback`, `content`, `submissionContent`, `questions`, `prompt` |

## Test scope — instructor-reference-rag (D-038–D-040)

Tests live in `tests/instructor-reference-rag.test.ts`.

| Area | Coverage |
|------|----------|
| Validator (D-039) | rejects missing required fields; empty/whitespace `expectedSolution`; empty `correctnessCriteria`; `expectedSolution > 50,000`; `keyConcepts` entry `> 200` chars; `> 50` `keyConcepts` entries; accepts well-formed body; omitted `optionalNotes` transforms to `null` |
| Reference hash (D-040) | 64-char hex SHA-256; deterministic; object-key order independent; field changes change the hash; `keyConcepts` order is meaningful → reordering changes the hash |
| Auth | 401 with no headers |
| Student isolation | student GET / POST / versions list → 404 (privacy pattern D-019) |
| Privacy | unknown id → 404; cross-tenant instructor GET → 404; GET current before any version exists → 404; unknown `?version=N` → 404 |
| Append-only (D-038) | POST creates v1 with deterministic hash; subsequent POST creates v2; v1 is queryable and unchanged via `?version=1`; list is newest-first |
| Repo lockdown | interface keys are exactly `createNextVersion / getByVersion / getCurrentByAssignment / listVersionsByAssignment`; no `update` / `delete` |
| Reserved event purity | event shape has no `expectedSolution`, `keyConcepts`, `requiredReasoningSteps`, `commonMistakes`, `correctnessCriteria`, `optionalNotes`, `notes`, `content`; has `referenceHash` and `version` |

## Test scope — reference-rag-retrieval (D-041–D-044)

Tests live in `tests/reference-rag-retrieval.test.ts`.

| Area | Coverage |
|------|----------|
| Concept-check prompt builder | trusted block present iff `referenceSolution` is passed; trusted block precedes the submission block; submission remains wrapped as untrusted; `Optional instructor notes:` omitted when null, included otherwise |
| Verification prompt builder | trusted block present iff `referenceSolution` is passed; Q/A and submission blocks remain wrapped as untrusted; trusted block precedes submission |
| Stub concept-check provider (D-044) | prepends `reference-key-concept` question when keyConcepts present; falls back to `reference-reasoning-step` when only requiredReasoningSteps present; existing snippet templates when no reference |
| Stub verification provider (D-044) | appends `"Reference applied (vN, hash XXXXXXXX)."` when reference present; result/aggregation unchanged vs. no-reference |
| HTTP — concept-checks | with reference: pin fields persisted on the row; first question has `conceptTag === "reference-key-concept"`. Without reference: all three pin fields are `null` |
| HTTP — verifications | with reference: pin fields persisted; `overallFeedback` contains "Reference applied". Without reference: pin fields `null`; no annotation |
| Regression — student isolation | student GET / POST `/v1/assignments/:id/reference-solution` still returns 404 |
| Reserved event purity | both reserved events gain `referenceSolutionId / referenceVersion / referenceHash` (nullable); raw `expectedSolution / keyConcepts / requiredReasoningSteps / commonMistakes / correctnessCriteria / optionalNotes / content / questions / prompt / answers / overallFeedback / perQuestionFeedback / feedback` remain excluded |

## Test scope — evidence-export

Tests live in `tests/evidence-report.test.ts`.

| Area | Coverage |
|------|----------|
| Builder — no sets, no verifications | report still assembles; `conceptCheckSets: []`, `verificationAttempts: []`, provenance reference fields all `null` |
| Builder — sets without verifications | sets present, attempts empty |
| Builder — all attempts newest-first | every verification attempt is included; ordering is DESC by `evaluatedAt` |
| Builder — sets newest-first | DESC by `generatedAt` |
| Builder — reference solution + pins | top-level `referenceSolution` present; pins on rows + provenance latest pin fields flow through |
| Builder — banned-language smoke | serialized JSON contains none of `legally admissible`, `legal proof`, `court-ready`, `guaranteed integrity`, `ai detection` |
| HTTP — 401 | no auth headers → 401 |
| HTTP — 404 student-only | instructor-only route; student auth → 404 |
| HTTP — 404 student-A on student-B | student auth on another student's submission → 404 |
| HTTP — 404 cross-tenant instructor | tenant B instructor on tenant A submission → 404 |
| HTTP — 404 unknown submission | unknown id → 404 |
| HTTP — 200 full payload | assignment + policy snapshot + reference solution + submission + ≥1 set + ≥1 attempt + provenance present and consistent; AI provider call counters unchanged |
| HTTP — 200 no concept checks | report works; both arrays empty; provenance latest-pin fields null |
| HTTP — 200 sets but no verification | report works; `verificationAttempts: []` |
| HTTP — 200 no reference | `referenceSolution: null`; pins on rows null; provenance reference field null |
| HTTP — student isolation regression | student `GET /v1/assignments/:id/reference-solution` still 404; student `GET /v1/submissions/:id/evidence-report` still 404 |
| HTTP — banned language absent | response body has none of the banned phrases (case-insensitive) |
| HTTP — no ledger emission | ledger route remains 501 stub; report GET is pure read |
| Page text guard — long disclaimer constant | `EVIDENCE_REPORT_DISCLAIMER` matches the approved disclaimer text exactly |
| Page text guard — header disclaimer | `EVIDENCE_REPORT_HEADER_DISCLAIMER` matches "Verification signal for instructor review. Not a final course grade." |
| Page text guard — approved language | report page contains "Evidence-ready report" and "Print / Save as PDF" |
| Page text guard — banned-language scan | scan over evidence-report page, types file, route file, and builder file for `legally admissible`, `legal proof`, `court-ready`, `guaranteed integrity` |
| Page text guard — no "AI detection" claim | the rendered page does not contain "AI-detection" or "AI detection" as a positive claim (the disclaimer text lives in types/assignment.ts as a negation) |

## Test scope — basic-teacher-review-dashboard (D-045–D-046)

Tests live in `tests/instructor-dashboard.test.ts`.

| Area | Coverage |
|------|----------|
| Aggregator — empty input | zero counts, all four arrays empty |
| Aggregator — `submitted_no_checks` | submission with no sets surfaces in needs attention; `pendingConceptChecks` increments |
| Aggregator — `checks_no_verification` | submission with sets but no attempts; `pendingVerification` increments |
| Aggregator — `pass` / `needs_review` / `fail` | latest attempt's result drives the summary; pass excluded from `needsAttention` |
| Aggregator — re-verification | latest attempt wins (fail then pass → status `pass`, no `needsAttention` row) |
| Aggregator — multiple sets | latest set + its latest attempt decide status; older sets ignored |
| Aggregator — sorting | `needsAttention` oldest `lastActivityAt` first; `recentSubmissions` / `recentVerifications` newest-first |
| Aggregator — caps | output capped at `NEEDS_ATTENTION_CAP = 50`, `RECENT_SUBMISSIONS_CAP = 20`, `RECENT_VERIFICATIONS_CAP = 20` |
| Aggregator — `reviewUrl` shape | every row uses `/submissions/<id>?role=instructor` |
| Aggregator — reference pin flow-through | `recentSubmissions` reads pin from latest set; `recentVerifications` reads pin from the row itself |
| Aggregator — defensive drop | submissions whose `assignmentId` isn't in the input set are excluded from both `recentSubmissions` and `needsAttention` |
| HTTP — 401 | no auth headers → `401 unauthorized` |
| HTTP — 404 | student-only auth → `404 not_found` (instructor-only) |
| HTTP — 200 empty | instructor on empty tenant → `200` with zero counts + empty arrays (D-046) |
| HTTP — 200 populated | tenant with all four submission states → correct counts; correct `needsAttention` membership; newest-first ordering on both recent tables |
| HTTP — cross-tenant isolation | tenant B sees its own empty view even after tenant A populates rows |
| HTTP — `reviewUrl` shape | dashboard rows match `/submissions/<id>?role=instructor` |
| HTTP — no provider side effects | help, concept-check, and verification provider call counters do NOT change across a dashboard GET |

## Test scope (product features — other)

_To be populated as features are approved for build._

## Test levels

### Unit tests
- Foundation: synthetic-data guard unit test
- (More to be added as features ship.)

### Integration tests
_To be defined when ledger write path and AI pipeline are implemented._

### End-to-end tests

#### Critical paths (must pass before any demo) — to be implemented post-foundation
- [ ] Concept check generation: student submits → checks generated → checks delivered
- [ ] Grading mode: confidence score path end-to-end
- [ ] Grading mode: required gate path end-to-end (with single-click instructor override)
- [ ] Grading mode: fail-only escalation path end-to-end
- [ ] Ledger write: every verification interaction produces a signed ledger entry
- [ ] Ledger read: instructor can retrieve and view signed ledger entries
- [ ] Ledger export: export produces tamper-evident document
- [ ] Tenant isolation: tenant A cannot access tenant B's data
- [ ] Prompt injection: adversarial student submission cannot override system prompt

---

## Compliance test cases

### FERPA
- Foundation: no real student data may flow. Enforced by `synthetic-data-guard.ts` + F8.
- Post-foundation: tests for FP-001 through FP-006 (see docs/security-review.md).

### Multi-tenant isolation
- Foundation: no tenant logic yet; `tenant_id` field reserved on future schema.
- Post-foundation: row-level isolation tests.

---

## Performance test cases

_To be defined post-foundation._

---

## Open questions for founder

- Auth provider (deferred L3) — required before integration test layer can begin
- Production database provider (deferred L3) — required before deployment runbook is written

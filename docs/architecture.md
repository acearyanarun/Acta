# Architecture

**Purpose:** System architecture, service map, data flows, and ledger design options for Acta.
**Owner:** software-architect-agent
**Last updated:** 2026-05-10
**Status:** Foundation section finalized 2026-05-10. Full architecture (ledger, contracts,
data flows) still pending — to be authored before next /build-feature run.

---

## Foundation architecture (D-007 through D-015)

Foundation is scaffolding only. Approved choices:

| Layer | Choice | Decision |
|-------|--------|----------|
| Package manager | pnpm workspaces | D-007 ambit |
| Language | TypeScript end-to-end | D-007 / D-008 |
| Frontend | Next.js 14 App Router | D-007 |
| Backend | Fastify (separate service) | D-008 |
| Database engine | Postgres | D-009 |
| DB hosting (foundation) | Local Docker Postgres | D-010 |
| ORM | Drizzle | D-011 |
| Lint / format | Biome | D-012 |
| Test runner | Vitest | D-013 |
| CI | GitHub Actions (lint + typecheck + smoke) | D-014 |
| Ledger signing (dev) | Ed25519 via Node `crypto` | D-015 |
| AI provider (dev) | Anthropic Claude (synthetic data only) | D-003 |

### Service topology (foundation)

```
┌────────────────┐         ┌────────────────┐         ┌─────────────────┐
│  Next.js 14    │  HTTP   │   Fastify      │   SQL   │  Postgres (DB)  │
│  frontend      │ ──────▶ │   backend      │ ──────▶ │  local Docker   │
│  (port 3000)   │         │  (port 4000)   │         │  (port 5432)    │
└────────────────┘         └────────────────┘         └─────────────────┘
        │                          │
        │                          └──▶ Synthetic data only (D-003 guard)
        │
        └──▶ Placeholder pages only (no product logic)
```

### Data flow (foundation)

- No real data flows in foundation. All routes return 501 except `/healthz`.
- `synthetic-data-guard.ts` runs at backend boot and refuses to start if `ALLOW_REAL_STUDENT_DATA=true` and `FERPA_DPA_REFERENCE` is empty.

### Tenant model

Institution is the tenant boundary. Foundation does not implement isolation logic but
reserves a `tenant_id` column in the future ledger schema (to be designed in next /build-feature).

---

## Teacher assignment policy architecture (D-016–D-021)

### Backend

- `src/backend/src/db/schema.ts` — Drizzle table definitions for `assignments`, `assignment_policy_versions`
- `src/backend/src/db/client.ts` — postgres-js + Drizzle; falls back to in-memory repo if `DATABASE_URL` unreachable (dev convenience)
- `src/backend/src/db/migrations/0001_assignment_policy.sql`
- `src/backend/src/repo/assignments-repo.ts` — interface (`AssignmentsRepo`)
- `src/backend/src/repo/assignments-pg-repo.ts` — Postgres impl
- `src/backend/src/repo/assignments-memory-repo.ts` — in-memory impl (tests + DB-down fallback)
- `src/backend/src/lib/auth-placeholder.ts` — header reader; preHandler that 401s on missing
- `src/backend/src/lib/policy-hash.ts` — canonical-JSON + SHA-256
- `src/backend/src/lib/ulid.ts` — ULID generator (Node `crypto.randomBytes` based)
- `src/backend/src/lib/validators/assignment-policy.ts` — zod schemas
- `src/backend/src/routes/assignments.ts` — full CRUD wired to repo via Fastify decorator

### Frontend

- `src/frontend/lib/types/assignment.ts` — mirrors api-contracts shapes
- `src/frontend/lib/api-client.ts` — extended with assignment functions
- `src/frontend/app/instructor/page.tsx` — list
- `src/frontend/app/instructor/new/page.tsx` — create form
- `src/frontend/app/instructor/[id]/page.tsx` — view (current or `?version=N`)
- `src/frontend/app/instructor/[id]/edit/page.tsx` — edit form
- `src/frontend/components/assignment-form.tsx`
- `src/frontend/components/verification-mode-selector.tsx`
- `src/frontend/components/ai-help-policy.tsx`
- `src/frontend/components/version-badge.tsx`

### Versioning model (D-018)

PUT is **insert + pointer-bump**, transactional:

```sql
BEGIN;
INSERT INTO assignment_policy_versions (id, assignment_id, tenant_id, instructor_id,
  version, title, instructions, rubric, ai_help, verification_mode, policy_hash)
VALUES (<ulid>, :id, :tenant, :instructor, :nextVersion, ...);
UPDATE assignments
  SET current_version = :nextVersion, updated_at = now()
  WHERE id = :id AND tenant_id = :tenant;
COMMIT;
```

No row in `assignment_policy_versions` is ever updated or deleted by app code.

### Reserved ledger linkage

A future ledger event for a submission against assignment `A` at version `N` will reference:
- `assignmentId = A`
- `policyVersionId = <ULID of the version row>` (immutable anchor)
- `policyVersion = N`
- `policyHash = <sha256 of canonical version body>`

Because `assignment_policy_versions` rows are immutable, replaying the chain at appeal time always resolves to the exact policy in effect at submission time.

---

## Student-guided-help architecture (D-022–D-026)

### Backend

- `src/backend/src/lib/prompt-builder.ts` — pure deterministic function: `(policy, requestType?, messages) → systemPrompt`
- `src/backend/src/lib/validators/help-request.ts` — zod for chat request body
- `src/backend/src/lib/auth-placeholder.ts` — extended to accept student or instructor header
- `src/backend/src/ai/providers/types.ts` — `AiProvider` interface
- `src/backend/src/ai/providers/stub-provider.ts` — deterministic canned responses; enforces restrictFinalAnswer via trigger-phrase heuristic
- `src/backend/src/ai/providers/anthropic-provider.ts` — real Anthropic SDK call, gated on `ANTHROPIC_API_KEY`
- `src/backend/src/ai/providers/select-provider.ts` — picks stub vs. real at boot, logs which was selected
- `src/backend/src/routes/help.ts` — `POST /v1/assignments/:id/help`
- `src/backend/src/routes/student.ts` — `GET /v1/student/assignments`, `GET /v1/student/assignments/:id`
- `src/backend/src/repo/assignments-repo.ts` — extended interface: `listByTenant`, `getByTenantId`
- Both repo impls implement the new methods

### Frontend

- `src/frontend/lib/types/assignment.ts` — extend with `HelpRequestType`, `HelpResponse`, `ChatMessage`
- `src/frontend/lib/api-client.ts` — extend with `listStudentAssignments`, `getStudentAssignment`, `postHelp`
- `src/frontend/app/student/page.tsx` — list
- `src/frontend/app/student/[id]/page.tsx` — chat
- `src/frontend/components/help-chat.tsx` — chat state
- `src/frontend/components/help-request-type-picker.tsx` — chips
- `src/frontend/components/policy-banner.tsx` — banner

### Stateless model (D-023)

Each POST reads the current policy version. Response includes the snapshot. Frontend
pins the first response's `policyVersionId` and shows a drift banner if a later
response carries a different `policyVersionId`. No chat persistence in this feature.

### Reserved ledger events (not emitted)

`chat.session.started`, `chat.message`, `chat.policy.drift` — shapes in api-contracts.md.
Future ledger feature will emit and persist them.

---

## Student-submission architecture (D-027–D-029)

### Backend
- `src/backend/src/db/schema.ts` — append `submissions` Drizzle table with FKs to `assignments` and `assignment_policy_versions`
- `src/backend/src/db/migrations/0002_submissions.sql`
- `src/backend/src/lib/content-hash.ts` — SHA-256 hex helper
- `src/backend/src/lib/validators/submission.ts` — zod for `{ content }`
- `src/backend/src/repo/submissions-repo.ts` — interface
- `src/backend/src/repo/submissions-memory-repo.ts` — in-memory impl
- `src/backend/src/repo/submissions-pg-repo.ts` — Drizzle/Postgres impl
- `src/backend/src/routes/submissions.ts` — REPLACES the 501 stub with `POST /v1/assignments/:id/submissions`, `GET /v1/assignments/:id/submissions`, `GET /v1/submissions/:id`
- `src/backend/src/server.ts` — wires the submissions repo

### Snapshot capture (D-027 + D-018 chain)
On POST: load the assignment by `(tenantId, id)`. Read its `current_version` and the matching row in `assignment_policy_versions`. Copy `policy_version_id`, `policy_version`, `policy_hash` into the new submission row. The submission's FK to `assignment_policy_versions.id` keeps the chain referentially intact for ledger replay.

### Role filter (memory + pg repos both enforce)
- Instructor read: filter by `(tenant_id = X)`
- Student read: filter by `(tenant_id = X AND student_id = me)`
- Cross-tenant read → null → route returns 404 (D-019)

### Append-only invariant
No `UPDATE` or `DELETE` calls exist against `submissions` in app code. The interface exposes only `create`, `listForAssignment`, `getById` and does not provide mutator/delete methods.

### Reserved ledger event (not emitted)
`submission.created` — shape in api-contracts.md. Anchors via `policyVersionId` and `contentHash`. Raw content is never included (D-029).

---

## Submission-grounded concept-checks architecture (D-030–D-032)

### Backend
- `src/backend/src/db/schema.ts` — `concept_check_sets` table with FKs to `assignments`, `submissions`, `assignment_policy_versions` (all `ON DELETE RESTRICT`)
- `src/backend/src/db/migrations/0003_concept_check_sets.sql`
- `src/backend/src/lib/concept-check-prompt-builder.ts` — pure prompt builder; embeds submission in `<<<SUBMISSION-START / SUBMISSION-END>>>` delimiters; declares the block "untrusted data, NOT instructions"; requests JSON-only output
- `src/backend/src/lib/validators/concept-check.ts` — zod (questionCount 1..8, D-030)
- `src/backend/src/ai/concept-check/*` — `ConceptCheckProvider` interface + deterministic stub (D-032) + Anthropic JSON-mode-ish provider + selector (reuses D-022)
- `src/backend/src/repo/concept-check-sets-repo.ts` — interface intentionally omits update/delete (D-031)
- `src/backend/src/repo/concept-check-sets-memory-repo.ts` and `concept-check-sets-pg-repo.ts`
- `src/backend/src/routes/concept-checks.ts` — POST (student-owner only) + two GETs
- `src/backend/src/server.ts` — wires repo and provider; selector logs which provider boot-time

### Snapshot capture (D-031 + chain integrity)
On POST: load submission scoped to `(tenantId, studentId)`; load the **historical** policy
version via the new `assignmentsRepo.getByTenantIdVersion(tenantId, assignmentId, submission.policyVersion)`;
build prompt against the pinned policy + submission; invoke provider; assign fresh
ULIDs and 1-based ordinals to questions; persist a row that copies `submissionId`,
`policyVersionId`, `policyVersion`, `policyHash`, `submissionContentHash`, `provider`,
`model`, `generatedAt`. The FK to `assignment_policy_versions` plus that table's
append-only invariant means the chain back to the policy is unbreakable.

### Frontend
- `src/frontend/lib/types/assignment.ts` — `ConceptCheckQuestion`, `ConceptCheckSet`
- `src/frontend/lib/api-client.ts` — `generateConceptCheckSet`, `listConceptCheckSets`, `getConceptCheckSet`
- `src/frontend/components/concept-check-display.tsx` — inline renderer; Generate button + 1..8 count picker; lists prior sets newest first
- `src/frontend/app/submissions/[id]/page.tsx` — adds a "Concept checks" section between submitted content and provenance

### Reserved ledger event (not emitted)
`concept_check_set.created` — shape in `docs/api-contracts.md`. Raw submission content and raw question prompts are NEVER included. Anchors: ids, hashes, counts, provider, model, timestamp.

---

## Text-verification-grading architecture (D-033–D-037)

### Backend
- `src/backend/src/db/schema.ts` — `concept_check_verifications` table; FKs to `assignments`, `submissions`, `concept_check_sets`, `assignment_policy_versions` (all `ON DELETE RESTRICT`); migration `0004_concept_check_verifications.sql`
- `src/backend/src/lib/verification-prompt-builder.ts` — wraps submission and Q/A in two distinct delimited untrusted-data blocks
- `src/backend/src/lib/validators/concept-check-verification.ts` — zod (5,000 char per answer; non-empty; non-whitespace)
- `src/backend/src/ai/verification/*` — `VerificationProvider` interface; deterministic stub (D-035); Anthropic provider with conservative downgrade (D-036); selector
- `src/backend/src/repo/concept-check-verifications-*` — interface intentionally exposes only `create / listForSet / getById`
- `src/backend/src/routes/concept-check-verifications.ts` — POST + 2 GETs with privacy-pattern 404s
- Server wires repo + provider via `BuildOptions`

### Cross-check against the set's question IDs (route-level)
On POST, after zod parsing, the route loads the student-owned set (404 if not theirs) and runs `crossCheckAnswers(answers, set.questions)`:
- Duplicate `questionId` in request → `400 duplicate_question_id`
- `questionId` not in the set → `400 unknown_question_id`
- Any set question without an answer → `400 missing_answers`

This is defense-in-depth above zod and runs BEFORE the evaluator is invoked.

### Provider selection (reuses D-022)
`selectVerificationProvider({ anthropicApiKey, anthropicModel })`:
- API key empty → `createStubVerificationProvider()` (deterministic; D-035)
- API key set → `createAnthropicVerificationProvider({ apiKey, model })` (default `claude-haiku-4-5-20251001`, D-026)

The Anthropic provider strictly validates `result ∈ {pass, needs_review, fail}` (throws on unknown), fills missing `perQuestionFeedback` rows with conservative defaults, and downgrades the overall result to at most `needs_review` if any rows were missing (D-036).

### Reserved ledger event (not emitted)
`concept_check_verification.created` — shape in `docs/api-contracts.md`. Raw answers, raw feedback, raw submission content, and raw question prompts are NEVER included. Anchors: ids, hashes, result, provider, model, timestamp.

---

## Instructor reference RAG architecture (D-038–D-040)

### Backend
- `src/backend/src/db/schema.ts` — `assignment_reference_solutions` table; FK to `assignments` (ON DELETE RESTRICT); `UNIQUE(assignment_id, version)`
- `src/backend/src/db/migrations/0005_assignment_reference_solutions.sql`
- `src/backend/src/lib/reference-hash.ts` — canonical-JSON + SHA-256 hex; lists preserve order (D-040)
- `src/backend/src/lib/validators/reference-solution.ts` — zod (D-039 body limits)
- `src/backend/src/repo/reference-solutions-{repo,memory-repo,pg-repo}.ts` — interface omits update/delete AND never accepts a `studentId` parameter (defense in depth: a student-facing route cannot accidentally be wired)
- `src/backend/src/routes/reference-solutions.ts` — three routes; gated on `req.auth?.instructorId`; students → 404 (D-019)
- `src/backend/src/server.ts` — wires repo

### Append-only version semantics (D-038)
On POST: the repo (PG) reads `MAX(version)` for the assignment inside a transaction, computes `nextVersion`, computes `referenceHash` over the canonical body, and inserts. No mutator/delete method exists on the interface. "Current" is always `ORDER BY version DESC LIMIT 1`. Future verification feature will pin `referenceSolutionId` + `referenceHash` on its rows so a grade appeal can replay against the exact reference truth in effect at evaluation time.

### Student isolation (defense in depth)
1. **Route:** `requireInstructor()` returns 404 when the request has only `studentAuth.studentId` (no `auth.instructorId`).
2. **Repo:** no method signature accepts `studentId`; the interface forces tenant-scoped, instructor-context reads only.
3. **Frontend:** the `ReferenceSolutionSection` is rendered only on `/instructor/[id]`; no student-facing page imports it.
4. **API client:** `getReferenceSolution` / `saveReferenceSolution` / `listReferenceSolutionVersions` / `getReferenceSolutionVersion` all use the `"instructor"` header role.

### Reserved ledger event (not emitted)
`assignment_reference_solution.created` — hash-anchor-only shape in `docs/api-contracts.md`. Raw expectedSolution / keyConcepts / requiredReasoningSteps / commonMistakes / correctnessCriteria / optionalNotes are NEVER included.

### NOT changed by this feature
- Concept-check generation prompt (`buildConceptCheckSystemPrompt`)
- Verification grading prompt (`buildVerificationSystemPrompt`)
- Both providers (stub + Anthropic) for either pipeline
- All existing routes / repos / schemas for prior features

A follow-up feature `reference-rag-retrieval` will fold the trusted reference context into the concept-check and verification prompts under a separate pre-flight.

---

## Reference-RAG retrieval architecture (D-041–D-044)

### Backend
- `src/backend/src/db/migrations/0006_reference_pinning.sql` — adds nullable `reference_solution_id` / `reference_version` / `reference_hash` to `concept_check_sets` and `concept_check_verifications`. FK to `assignment_reference_solutions(id)` ON DELETE RESTRICT.
- `src/backend/src/db/schema.ts` — Drizzle columns added on both tables.
- `src/backend/src/lib/types.ts` — `ConceptCheckSet`, `ConceptCheckVerification` carry the three nullable pin fields. `ReferenceSolution` type unchanged.
- `src/backend/src/lib/concept-check-prompt-builder.ts` — accepts optional `referenceSolution`. When non-null, emits a `<<<INSTRUCTOR-REFERENCE-START` / `INSTRUCTOR-REFERENCE-END>>>` trusted block ABOVE the submission block (D-042) plus two reference-specific rules. When null, omits the block and the rules entirely (D-043).
- `src/backend/src/lib/verification-prompt-builder.ts` — same pattern; one additional rule about evaluating against the instructor's expected solution path.
- `src/backend/src/ai/concept-check/types.ts` and `verification/types.ts` — provider request types carry optional `referenceSolution`.
- `src/backend/src/ai/concept-check/stub-concept-check-provider.ts` — when reference present with ≥ 1 entry in keyConcepts or requiredReasoningSteps, prepends one deterministic question that references the first such entry (D-044). Remaining N-1 questions use existing snippet templates.
- `src/backend/src/ai/verification/stub-verification-provider.ts` — when reference present, appends `"Reference applied (v<n>, hash <short>)."` to `overallFeedback`. Aggregation rules unchanged (D-044).
- `src/backend/src/ai/concept-check/anthropic-concept-check-provider.ts` — UNCHANGED. Consumes upstream `systemPrompt`.
- `src/backend/src/ai/verification/anthropic-verification-provider.ts` — UNCHANGED. Consumes upstream `systemPrompt`.
- `src/backend/src/repo/concept-check-sets-{repo,memory-repo,pg-repo}.ts` — `create()` accepts a `referencePin` object and persists the three nullable columns.
- `src/backend/src/repo/concept-check-verifications-{repo,memory-repo,pg-repo}.ts` — same.
- `src/backend/src/routes/concept-checks.ts` and `concept-check-verifications.ts` — both load `referenceSolutionsRepo.getCurrentByAssignment(...)` at the start of the POST handler and pass the result (or null) through to the prompt builder, the provider, and the repo `create` call.
- `src/backend/src/server.ts` — passes `referenceSolutionsRepo` into both `buildConceptCheckRoutes` and `buildConceptCheckVerificationRoutes`.

### Frontend
- `src/frontend/lib/types/assignment.ts` — `ConceptCheckSet` and `ConceptCheckVerification` carry the three nullable pin fields so API responses parse cleanly. **No UI behavior change** in this feature.

### Retrieval strategy
- RAG-lite: a single in-process lookup per generation/evaluation call. No vector DB, no embeddings, no chunking, no external service.
- Retrieval is performed by tenant-scoped key (`tenantId` + `assignmentId`). "Current" reference = `ORDER BY version DESC LIMIT 1` (D-038 / D-041).
- Reference content is never returned over any student-facing API. The existing `routes/reference-solutions.ts` instructor-only guards are unchanged.

### Reserved ledger events (still not emitted)
`concept_check_set.created` and `concept_check_verification.created` gain three new nullable anchor fields: `referenceSolutionId`, `referenceVersion`, `referenceHash`. Raw reference content, raw submission content, raw student answers, raw question prompts, and raw feedback are still NEVER included.

### Strictly-additive fallback (D-043)
If no reference exists for the assignment, every layer above behaves identically to the pre-feature implementation. The three pin fields are written as `NULL`; the prompt builder omits the trusted block; the stub providers run their original code path; the Anthropic providers receive the same prompt shape as before.

---

## Evidence-export architecture

### Backend
- New route `GET /v1/submissions/:id/evidence-report` in `src/backend/src/routes/evidence-report.ts`. Instructor-only (401 no auth, 404 student-only — D-019 / D-046 pattern). Pure read. No write side effects. No AI provider invocation. No ledger emission.
- New pure assembler `src/backend/src/lib/evidence-report-builder.ts` exports `buildEvidenceReport({ assignment, submission, referenceSolution, conceptCheckSets, verifications, generatedAt? })`. No I/O. Fully unit-testable.
- Route resolves the assignment at the EXACT pinned policy version on the submission via `assignmentsRepo.getByTenantIdVersion(tenantId, assignmentId, policyVersion)` — so the report renders the policy text that was in effect at submit time, not whatever is current.
- Route fetches the **current** Instructor Solution Guide via `referenceSolutionsRepo.getCurrentByAssignment` for the top-level `referenceSolution` field. Per-row reference pins (D-041) on each set and each attempt still carry the EXACT reference used at generation / evaluation time, so the historical anchor remains visible.
- Verifications across all sets on the submission are fetched per-set via `verificationsRepo.listForSet` (instructor view) and then merged + re-sorted DESC by `evaluatedAt` in the builder. ALL attempts are included; no truncation.
- No new repo method, no schema delta, no migration, no Drizzle change. All required reads already exist from prior features (assignment policy versioning, append-only submissions / sets / verifications, instructor-only reference repo).

### Frontend
- New client page `src/frontend/app/submissions/[id]/evidence-report/page.tsx` calls `getEvidenceReport(id)` from `lib/api-client.ts`. Renders eight ordered sections (header, policy, reference, submission, concept-check sets, verification attempts, provenance, disclaimer). The Print button is a single `window.print()` call.
- Approved disclaimers are constants exported from `src/frontend/lib/types/assignment.ts` (`EVIDENCE_REPORT_DISCLAIMER`, `EVIDENCE_REPORT_HEADER_DISCLAIMER`) so they are both source-of-truth and trivially regex-testable.
- Print styles in `globals.css` use `@media print` to hide the top nav, toolbar, back link, and any `button` element; force a white background and high-contrast text; and apply `break-inside: avoid` to each `.evidence-section` and `.evidence-card`.
- Entry points: `→ Open evidence report` on `/submissions/[id]?role=instructor` (instructor-only render); conditional `Evidence report` action link on all three dashboard tables, gated by whether a verification attempt exists for that submission. The top nav and student workspace are untouched.

### Privacy + scope
- Instructor-only. Student auth → 404. Cross-tenant instructor → 404. Same pattern as `/v1/instructor/dashboard`.
- The page surfaces raw Instructor Solution Guide content; this is acceptable because the page itself is instructor-only by API gate, and the existing reference-solution endpoints are already instructor-only (D-038 / D-040). The student route `/v1/assignments/:id/reference-solution` continues to return 404 for student auth (regression-tested).
- No banned language ("legally admissible / legal proof / court-ready / guaranteed integrity / AI detection") in any new file. The approved disclaimer explicitly negates the claim of being an AI-detection result.
- Server-side PDF generation is intentionally deferred. Browser print → save-as-PDF covers POC. No `puppeteer` / `pdfkit` / `react-pdf` dependency added.

### What this feature does NOT touch
- No AI provider, prompt builder, stub provider, model-routing change.
- No schema, migration, or Drizzle table change. No new repo method (read or write).
- No ledger event emission. No new reserved event shape. The endpoint is a pure read.
- No change to top nav, student workspace, ledger page, or any existing route auth.
- No change to dashboard layout beyond adding row action links.

---

## Teacher Review Dashboard architecture (D-045–D-046)

### Backend
- New file `src/backend/src/routes/instructor-dashboard.ts` registering `GET /v1/instructor/dashboard` (instructor-only; 401 no auth, 404 student-only — D-019 pattern; D-046).
- New pure aggregator `src/backend/src/lib/dashboard-aggregator.ts` exports `aggregateInstructorDashboard({ assignments, submissions, sets, verifications })` and the three caps (`NEEDS_ATTENTION_CAP = 50`, `RECENT_SUBMISSIONS_CAP = 20`, `RECENT_VERIFICATIONS_CAP = 20`). No I/O, no provider calls, no time-of-day branching — fully unit-testable.
- Three repos extended with tenant-wide read methods (D-045, instructor-context only — no `studentId` parameter):
  - `SubmissionsRepo.listByTenantAcrossAssignments({ tenantId, limit? })`
  - `ConceptCheckSetsRepo.listByTenantAcrossSubmissions({ tenantId, limit? })`
  - `ConceptCheckVerificationsRepo.listByTenantAcrossSets({ tenantId, limit? })`
  - All three sort newest-first by their natural timestamp and respect the optional `limit`. Implemented identically in the memory + pg repo pairs.
- Route fetches with bounded limits (500 / 1000 / 1000) so the aggregator's per-section caps (50 / 20 / 20) always have enough source material without unbounded memory growth on large tenants.
- No new schema. No new migration. No ledger event added. No AI provider invoked from the dashboard route.

### Status resolution (latest-wins, per submission)
The aggregator builds `setsBySubmission: Map<submissionId, ConceptCheckSet[]>` (sorted DESC by `generatedAt`) and `verificationsBySet: Map<setId, ConceptCheckVerification[]>` (sorted DESC by `evaluatedAt`). For each submission:
1. No sets → `submitted_no_checks` (counts `pendingConceptChecks`).
2. Latest set, no attempts → `checks_no_verification` (counts `pendingVerification`).
3. Latest set, ≥1 attempt → use the latest attempt's `result` (`pass` / `needs_review` / `fail`).

`lastActivityAt = max(submittedAt, latestSet.generatedAt?, latestAttempt.evaluatedAt?)` using ISO-8601 lexicographic compare. `needsAttention` is sorted oldest-first so the most-stale follow-up surfaces first; `recentSubmissions` and `recentVerifications` are newest-first.

### Frontend
- New client page `src/frontend/app/instructor/dashboard/page.tsx` calls `getInstructorDashboard()` from `lib/api-client.ts` on mount.
- Renders four sections: summary card grid, Needs attention table, Recent submissions table, Recent verifications table.
- Status / result pills reuse existing `.verification-status--*` classes; two new modifiers `.dashboard-pill--neutral` and `.dashboard-pill--info` cover non-verification states.
- Entry points: secondary CTA on `/instructor` header (`Review dashboard`); secondary back-row link `→ Open Review Dashboard` on `/instructor/[id]`. No top-nav addition.
- All `Review submission` links go to the existing `/submissions/[id]?role=instructor` page — no new review surface.

### Privacy semantics (D-046)
- No auth headers → 401 `unauthorized`.
- Student-only auth → 404 `not_found` (matches D-019: instructor-only routes never reveal existence to students).
- Instructor with empty tenant → 200 with zero counts and empty arrays. Mirrors how `GET /v1/student/assignments` returns `{items: []}` for empty tenants; does not leak whether OTHER tenants have data.

### What this feature does NOT touch
- No AI provider, prompt builder, stub provider, route prompt path, or model-routing change.
- No schema, migration, or Drizzle table change. No new repo write method. Existing `create()` signatures untouched.
- No ledger event emission. No new reserved ledger event shape — the dashboard is a read.
- No change to existing route auth, validators, or response shapes.
- No change to the frontend submission detail page, student workspace, ledger page, or top nav.

---

## Full architecture (to be authored in next /build-feature run)

The sections below are **placeholders** for the post-foundation architecture work.
software-architect-agent will author them before the next /build-feature against a
real feature (e.g., `ledger-write-path`, `assignment-policy`, `concept-check-pipeline`).

### Signed ledger design options (C2)

_software-architect-agent must propose 2–3 approaches with tradeoffs. Founder selects one._

- Option A — Hash-chained append-only log
- Option B — Signed event store
- Option C — Transparency-log style

(Detailed design pending. D-015 fixes the signing primitive — Ed25519 via Node `crypto`
for dev — but does not fix the storage model.)

### LMS integration (Q5 — DEFERRED to v1.5)

Standalone-first per Q5 resolution. LTI 1.3 stub only at foundation stage.

### Live oral assessment (Q4 — DEFERRED to v2)

Not in v1. Architecture must reserve a `modality` field on ledger entries.

---

## Open items

- Signed ledger storage model (post-foundation /build-feature)
- API contract for assignment policy, submission, check, ledger read, export
- Auth provider selection (deferred L3)
- Production database provider (deferred L3)
- Production deployment platform (deferred L3)

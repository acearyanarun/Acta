# Changelog

**Purpose:** Record of completed deliverables and significant decisions across all phases.
Updated by the chief-of-staff-orchestrator when any agent completes a phase deliverable.
**Owner:** chief-of-staff-orchestrator
**Last updated:** 2026-05-05
**Status:** Active

---

## Format

Each entry:
```
## [Date] [Phase] — [Agent] — [Deliverable]
Brief description of what was produced and any notable decisions or blockers.
```

---

## Log

### 2026-05-11 — /build-feature ai-help-master-toggle — shipped
Founder approved D-047 (assignment-level `aiHelpEnabled: boolean` master toggle;
hash-included; instructor-only authoring; help route refuses all requests when
off including `requestType="general"`; default true; no backfill required;
existing demo data unchanged).

Backend changes:
- New migration `src/backend/src/db/migrations/0007_ai_help_enabled.sql` adds
  `ai_help_enabled boolean NOT NULL DEFAULT true` to `assignment_policy_versions`.
  Drizzle schema extended with the matching column.
- `AssignmentPolicyVersion` + `CreateAssignmentInput` + `EvidenceReportPolicy` +
  `HashableVersionBody` types extended with the new field. The Zod validator
  `createAssignmentInputSchema` adds `aiHelpEnabled: z.boolean().optional().default(true)`
  so older clients that omit the field still write `true`.
- `computePolicyHash` now includes `aiHelpEnabled` in the canonical hash input.
  Two assignments otherwise identical but with different toggle states produce
  different hashes (asserted by a dedicated unit test).
- Memory + Postgres repos both default the field to `true` on create / update
  and persist whatever the caller provides.
- `POST /v1/assignments/:id/help` adds a master-toggle gate BEFORE the per-type
  `help_type_not_allowed` check. When `aiHelpEnabled === false` the route
  returns `400 { error: "ai_help_disabled", policyVersionId, policyVersion,
  policyHash, message }` and the provider is never invoked. `requestType`
  values including `"general"` and `"hint"` cannot bypass it.
- `evidence-report-builder` carries `aiHelpEnabled` into the policy snapshot.

Frontend changes:
- `<AssignmentForm>` adds a `Student AI help` radio group above the per-type
  checkboxes (`Enabled` / `Disabled` with one-line helper copy each). When
  disabled, the per-type checkboxes are visually + functionally disabled via
  a new `disabled` prop on `<AiHelpPolicyControl>` and an `.ai-help-inactive`
  wrapper class.
- `<PolicyBanner>` accepts an `aiHelpEnabled` prop (defaults to true). When
  false it renders a single prominent "AI help: Disabled for this assignment"
  row instead of the allowed / not-allowed / restrict-final-answer breakdown.
- `/student/[id]` gates `<HelpChat>` on `policy.aiHelpEnabled`. When off, the
  Step 2 card renders an `<output class="policy-banner--disabled">` status
  banner ("AI guided help is disabled for this assignment.") and a nudge to
  Step 3. Step 1's AI-help-rules disclosure also flips to the disabled banner.
- `/instructor/[id]` adds a new `Student AI help: Enabled/Disabled` row in the
  task-card Status checklist and surfaces the master state in the AI help
  policy disclosure (master pill + `.ai-help-inactive` styling on per-type
  list when off).
- `/submissions/[id]/evidence-report` policy snapshot prints `Student AI help
  (master): Enabled / Disabled` above the per-type rules; per-type list grays
  out when the master is off.
- New CSS primitives `.ai-help-master`, `.ai-help-master__option`,
  `.ai-help-master__hint`, `.ai-help-inactive`, `.policy-banner--disabled`.

Test changes:
- New file `tests/ai-help-master-toggle.test.ts` — 22 tests across validator
  default, hash inclusion, HTTP create/update with both true/false, policy
  versioning preserves prior `aiHelpEnabled` value, help-route 400 with code
  `ai_help_disabled` for no-requestType / `general` / `hint`, regressions for
  per-type `help_type_not_allowed` and `restrictFinalAnswer` outcome=`refused`
  when toggle is on, evidence-report includes the field, and three frontend
  static-text guards (student page, assignment form, policy banner).
- Existing AssignmentPolicyVersion fixtures in `instructor-dashboard.test.ts`,
  `evidence-report.test.ts`, `reference-rag-retrieval.test.ts`,
  `student-guided-help.test.ts`, `concept-check-generation.test.ts`, and
  `concept-check-verification.test.ts` updated to include `aiHelpEnabled: true`
  (typecheck would otherwise reject them — the field is required on the
  shape, optional only on `CreateAssignmentInput`).

Scope held:
- No new endpoint. No new ledger event. No AI behavior change. No prompt
  builder change. No new dependency. No real student data introduced.
- Foundation guard still passes (D-002 grep clean). Banned-language rules
  observed across all new copy.
- All 226 tests pass (was 204; +22 new).

Files modified — backend: `src/backend/src/lib/types.ts`,
`src/backend/src/lib/policy-hash.ts`,
`src/backend/src/lib/validators/assignment-policy.ts`,
`src/backend/src/lib/evidence-report-builder.ts`,
`src/backend/src/db/schema.ts`,
`src/backend/src/repo/assignments-memory-repo.ts`,
`src/backend/src/repo/assignments-pg-repo.ts`,
`src/backend/src/routes/help.ts`.
Files added — backend: `src/backend/src/db/migrations/0007_ai_help_enabled.sql`,
`tests/ai-help-master-toggle.test.ts`.

Files modified — frontend: `src/frontend/lib/types/assignment.ts`,
`src/frontend/components/assignment-form.tsx`,
`src/frontend/components/ai-help-policy.tsx`,
`src/frontend/components/policy-banner.tsx`,
`src/frontend/app/student/[id]/page.tsx`,
`src/frontend/app/instructor/[id]/page.tsx`,
`src/frontend/app/submissions/[id]/evidence-report/page.tsx`,
`src/frontend/app/globals.css`.

Files modified — docs: `docs/decisions.md` (D-047),
`docs/api-contracts.md` (response shape note),
`docs/changelog.md` (this entry).

### 2026-05-11 — /run-usability-testing-pass — shipped
Frontend-only simplification pass. No backend, API, schema, AI, prompt, ledger,
or test-assertion changes. All 204 tests still pass.

Pattern adopted: progressive disclosure via native `<details>`/`<summary>`. New
`.disclosure` CSS class provides the chevron + hover affordance. New `@media
print` rule force-expands every `<details>` so the evidence report still prints
fully regardless of on-screen open state.

Pages simplified:
- Home (`app/page.tsx`): cut the 60-word pitch paragraph to a single sentence;
  three big workspace cards moved above the 4-step demo strip.
- Instructor list (`/instructor`): page-sub reduced to one short line; empty
  state shortened.
- Instructor assignment (`/instructor/[id]`): now opens with a `task-card`
  status checklist (Policy / Solution Guide / Submissions count) plus Student
  submissions surfaced immediately. Instructions, Rubric, AI help policy,
  Verification mode, and Provenance/Version history are all `<details>`
  collapsed by default. The page sub paragraph was deleted.
- Instructor dashboard (`/instructor/dashboard`): page-sub shortened; summary
  cards renamed for terseness (`Pending checks`, `Passed`, `Failed`). Needs
  attention stays as the top card; Recent submissions and Recent verification
  attempts are now `<details>` collapsed by default with a count hint.
- Student list (`/student`): page-sub shortened; empty state shortened.
- Student assignment (`/student/[id]`): collapsed the 6-section layout into a
  4-step stepper (Read the task → Ask for help → Submit your work → Review your
  submissions). Each step lives in its own card with a numbered circle. Long
  instructions / rubric / AI help rules are `<details>` inside Step 1. The
  duplicate `<PolicyBanner>` previously rendered inside `<HelpChat>` is
  removed (QA finding M1) — the AI help rules now appear in exactly one place
  (Step 1, collapsed).
- Submission detail (`/submissions/[id]`): new `primary-action-card` sits
  above the fold and is role-aware — student sees `Generate concept checks` or
  `Answer concept checks below` with a `Jump to checks` button; instructor
  sees `Open evidence report`. Submitted content is `<details>` collapsed by
  default. Provenance is `<details>` collapsed by default.
- Evidence report (`/submissions/[id]/evidence-report`): every long section
  (policy snapshot, Instructor Solution Guide, student submission, concept
  checks, verification attempts, provenance) is now `<details>`. Policy and
  the two attempts sections are open by default; reference / submission /
  provenance start collapsed. The `@media print` rule force-renders every
  details body so the printed PDF is identical to the fully-expanded report.
- Ledger placeholder (`/ledger`): unchanged (already short).

Components simplified:
- `help-chat.tsx`: removed the internal `<PolicyBanner>` render. The policy
  now lives in exactly one place per student page.
- `concept-check-display.tsx`: each concept-check set is wrapped in a
  collapsible `<details>` whose summary shows generatedAt, question count,
  and latest verification result. The newest set is open by default; older
  sets collapse. Reference-pin tag (instructor-only) moves into the summary.
- `reference-solution-section.tsx`: each long field (Expected solution, Key
  concepts, Required reasoning steps, Common mistakes, Correctness criteria,
  Optional notes) is now its own `<details>`, all collapsed by default. The
  header (version + referenceHash + Edit button) stays prominent.

CSS additions in `app/globals.css`:
- `.disclosure` + `.disclosure__body` + `.disclosure__hint` for the
  details/summary pattern (chevron, hover, body padding, right-aligned hint).
- `.task-card` + `.task-card__row` + `.task-card__state` for the instructor
  status checklist.
- `.step-header` + `.step-header__num` for the student stepper.
- `.primary-action-card` for the role-aware CTA on `/submissions/[id]`.
- `@media print { details > *:not(summary) { display: block !important; }}`
  so the evidence report prints fully expanded regardless of on-screen
  collapsed/expanded state.

QA + scope:
- 204 / 204 tests still pass (no test assertions touched).
- `pnpm lint`, `pnpm -r typecheck`, `pnpm --filter @acta/frontend build`,
  `scripts/check-foundation.sh` all clean.
- No backend changes. No API contract changes. No schema. No AI behavior
  change. No prompt change. No ledger emission. No new dependency.
- No "legally admissible / legal proof / court-ready / guaranteed integrity /
  AI detection" language introduced.
- Route URLs unchanged. `/submissions/[id]?role=student|instructor` still
  works exactly as before. Student workspace still cannot reach the evidence
  report (API gate enforces 404).

Files modified (frontend only):
- `src/frontend/app/{page,instructor/page,instructor/[id]/page,instructor/dashboard/page,student/page,student/[id]/page,submissions/[id]/page,submissions/[id]/evidence-report/page,globals.css}.tsx`
- `src/frontend/components/{help-chat,concept-check-display,reference-solution-section}.tsx`

Files updated (docs):
- `docs/ui-spec.md` (progressive-disclosure principles, step-header,
  primary-action-card, task-card, details-print rule).
- `docs/changelog.md` (this entry).

### 2026-05-11 — /build-feature evidence-export — shipped
Founder approved the feature with explicit carve-outs in 15 sections: HTML
printable report + browser print/save-as-PDF; instructor-only; all verification
attempts newest-first; current Instructor Solution Guide snapshot with per-row
historical pins preserved; no schema change; no AI invocation; no ledger
emission; no banned legal/AI-detection language; no server-side PDF dependency.

New backend route `GET /v1/submissions/:id/evidence-report`
(`src/backend/src/routes/evidence-report.ts`) returns the structured
`EvidenceReport` payload. Assembly happens in
`src/backend/src/lib/evidence-report-builder.ts` as a pure function
(`buildEvidenceReport`) — no I/O, no provider calls, no time-of-day branching.
The route resolves the assignment at the EXACT pinned policy version on the
submission via `assignmentsRepo.getByTenantIdVersion`, so historical
submissions render the policy text that was active at submit time. The
top-level `referenceSolution` is the CURRENT reference at report-generation
time; per-row reference pins (D-041) on each set and each verification attempt
preserve the EXACT historical anchor used at generation/evaluation time. ALL
verification attempts across ALL sets on the submission are included,
newest-first; no truncation. Privacy follows D-019/D-046: 401 no auth, 404
student-only / cross-tenant / unknown id, 200 same-tenant instructor.

New frontend page `src/frontend/app/submissions/[id]/evidence-report/page.tsx`
calls `getEvidenceReport(id)` and renders the eight approved sections —
header, policy snapshot, Instructor Solution Guide snapshot, student
submission, concept-check sets, verification attempts, provenance/hash
summary, disclaimer. A primary `Print / Save as PDF` button invokes
`window.print()`. The approved disclaimer text lives as a constant in
`src/frontend/lib/types/assignment.ts` (`EVIDENCE_REPORT_DISCLAIMER`,
`EVIDENCE_REPORT_HEADER_DISCLAIMER`) so it is both source-of-truth for the page
and trivially regex-testable.

CSS additions in `src/frontend/app/globals.css`: `.evidence-report-page`,
`.evidence-toolbar`, `.evidence-section`, `.evidence-card`,
`.evidence-questions`, plus a `@media print` block that hides `.top-nav`,
`.evidence-toolbar`, `.back-link`, `.back-row`, and `button`; forces white
background and `#000` text; applies `break-inside: avoid` to every
`.evidence-section` and `.evidence-card` for clean page breaks.

Entry points added:
- `/submissions/[id]?role=instructor`: secondary back-row link
  `→ Open evidence report` rendered only when `role === "instructor"`.
- `/instructor/dashboard`:
  - Recent verifications table action cell always shows
    `Review submission · Evidence report`.
  - Needs attention table action cell shows `Evidence report` when
    `latestVerificationResult != null` (i.e., `needs_review` / `fail`).
  - Recent submissions table action cell shows `Evidence report` when that
    submission appears in `dashboard.recentVerifications` (computed via a
    `Set<submissionId>` in the page).

Tests: 24 new tests in `tests/evidence-report.test.ts` covering builder
behavior (empty input, sets-only, sets+verifications newest-first across all
attempts, sets newest-first, reference solution + pin flow-through, banned
language scan on serialized JSON) and HTTP route behavior (401 / 404
student-only / 404 student cross-row / 404 cross-tenant / 404 unknown id / 200
full payload with all sections / 200 empty checks / 200 sets-no-verification /
200 no-reference / student-isolation regression / banned-language scan on
response body / no ledger emission), plus four static-text guards over the new
files (long disclaimer constant, header disclaimer, approved language, no
banned language). All pass. Full backend suite still green (204 tests).

Scope held: no schema, no migration, no Drizzle change. No new repo method —
read or write. No AI provider invocation. No ledger event emission. No
reserved event shape. No change to top nav, student workspace, ledger page,
or student `/submissions/[id]` behavior. No server-side PDF dependency
(`puppeteer` / `pdfkit` / `react-pdf` NOT added). The student route
`/v1/assignments/:id/reference-solution` continues to return 404 with student
auth. No "legally admissible / legal proof / court-ready / guaranteed
integrity / AI detection" claim anywhere; the approved disclaimer explicitly
negates the AI-detection claim. No L3 decision recorded (the implementation
discovered nothing new that required a recorded decision).

Files added (backend): `src/backend/src/lib/evidence-report-builder.ts`,
`src/backend/src/routes/evidence-report.ts`,
`tests/evidence-report.test.ts`.
Files modified (backend): `src/backend/src/lib/types.ts` (evidence types),
`src/backend/src/server.ts` (route registration + import).
Files added (frontend):
`src/frontend/app/submissions/[id]/evidence-report/page.tsx`.
Files modified (frontend): `src/frontend/lib/types/assignment.ts` (mirrored
types + disclaimer constants), `src/frontend/lib/api-client.ts`
(`getEvidenceReport`), `src/frontend/app/submissions/[id]/page.tsx` (entry
link), `src/frontend/app/instructor/dashboard/page.tsx` (conditional row
links), `src/frontend/app/globals.css` (evidence + print styles).
Files updated (docs): `docs/api-contracts.md`, `docs/ui-spec.md`,
`docs/architecture.md`, `docs/product-requirements.md` (R11),
`docs/user-stories.md`, `docs/test-plan.md`, `docs/changelog.md`,
`docs/sprint-backlog.md`.

### 2026-05-11 — /build-feature basic-teacher-review-dashboard — shipped
Founder approved D-045 (tenant-wide read methods on `SubmissionsRepo`,
`ConceptCheckSetsRepo`, `ConceptCheckVerificationsRepo`; instructor-context only;
no `studentId` parameter) and D-046 (privacy semantics: 401 no auth, 404
student-only, 200 + empty for instructor on empty tenant — matching the existing
tenant-scoped pattern, NOT 404 cross-tenant).
New backend route `GET /v1/instructor/dashboard` (`src/backend/src/routes/instructor-dashboard.ts`)
returns `{ summary, needsAttention, recentSubmissions, recentVerifications }`.
Aggregation is a pure function in `src/backend/src/lib/dashboard-aggregator.ts`
(`aggregateInstructorDashboard`, plus `NEEDS_ATTENTION_CAP = 50`,
`RECENT_SUBMISSIONS_CAP = 20`, `RECENT_VERIFICATIONS_CAP = 20`). Per-submission
status is latest-wins: no sets → `submitted_no_checks`; latest set without
attempts → `checks_no_verification`; otherwise latest attempt's `result`. Pass
rows do NOT appear in `needsAttention`. `lastActivityAt = max(submittedAt,
latestSet.generatedAt?, latestAttempt.evaluatedAt?)` via ISO-8601 lex compare.
Three repos extended with tenant-wide list methods
(`listByTenantAcrossAssignments` / `listByTenantAcrossSubmissions` /
`listByTenantAcrossSets`), implemented identically in memory + pg impls. Route
fetches with bounded source limits (500 / 1000 / 1000) before aggregator applies
output caps (50 / 20 / 20).
Reference pin fields (D-041) flow through unchanged: `recentSubmissions` reads
the pin from the latest set on the submission; `recentVerifications` reads the
pin directly from the verification row.
Frontend: new client page `/instructor/dashboard` calls a new
`getInstructorDashboard()` in `lib/api-client.ts` and renders four sections —
summary card grid (7 cards), Needs attention table, Recent submissions table,
Recent verification attempts table. Status pills reuse existing
`.verification-status--{sufficient,partial,insufficient}` classes; two new
modifiers `.dashboard-pill--neutral` (submitted_no_checks) and
`.dashboard-pill--info` (checks_no_verification) cover the non-verification
states. Entry points: secondary `Review dashboard` CTA on `/instructor`, and a
new `.back-row` pattern with `→ Open Review Dashboard` link on `/instructor/[id]`.
Top nav and student workspace untouched.
Tests: 19 new tests in `tests/instructor-dashboard.test.ts` covering aggregator
unit behavior (empty input, three statuses, re-verification, multi-set, sorting,
caps, reviewUrl, reference pin flow-through, defensive drop) and HTTP route
behavior (401 / 404 / 200-empty / 200-populated / cross-tenant 200-empty /
reviewUrl shape / no AI provider invocation). All pass. Full backend suite still
green (180 tests).
Scope held: no schema, no migration, no Drizzle change. No ledger event added or
emitted. No AI provider invoked from the dashboard route. No reference solution
content surfaced to students. No change to top nav, student workspace, ledger
page, submission detail page, or existing route auth shape. No "legally
admissible" language introduced.
Decisions recorded: D-045 (tenant-wide read methods, instructor-only) and
D-046 (dashboard privacy semantics).
Files added (backend): `src/backend/src/lib/dashboard-aggregator.ts`,
`src/backend/src/routes/instructor-dashboard.ts`, `tests/instructor-dashboard.test.ts`.
Files modified (backend): `src/backend/src/lib/types.ts` (dashboard types),
`src/backend/src/repo/{submissions,concept-check-sets,concept-check-verifications}-repo.ts`
plus their memory + pg impls, `src/backend/src/server.ts` (route registration).
Files added (frontend): `src/frontend/app/instructor/dashboard/page.tsx`.
Files modified (frontend): `src/frontend/lib/types/assignment.ts` (mirrored
dashboard types + `NEEDS_ATTENTION_LABEL`), `src/frontend/lib/api-client.ts`
(`getInstructorDashboard`), `src/frontend/app/instructor/page.tsx` (Review
dashboard CTA), `src/frontend/app/instructor/[id]/page.tsx` (back-row link),
`src/frontend/app/globals.css` (dashboard styles).
Files updated (docs): `docs/decisions.md` (D-045, D-046),
`docs/api-contracts.md`, `docs/ui-spec.md`, `docs/architecture.md`,
`docs/product-requirements.md` (R10), `docs/user-stories.md`,
`docs/test-plan.md`, `docs/changelog.md`, `docs/sprint-backlog.md`.

### 2026-05-05 — Setup — chief-of-staff-orchestrator — Agent OS initialized
Multi-agent operating system created. All directories, policy files, agent files, command
files, and starter docs are in place. Q1–Q6 initialized as Open in docs/decisions.md.
No product work begun. Ready for /research-mvp when founder chooses to begin.

### 2026-05-05 — Phase 1 pre-seed — market-research-agent — Competitor PDF ingested
Internal competitive analysis PDF (Competitive Analysis 5_5_26) ingested into:
docs/competitor-map.md (full 14-capability × 13-competitor matrix),
docs/source-log.md (S-001 citation + 11 pending external sources),
docs/research-claims.md (13 labeled claims, all [INTERNAL ASSESSMENT] pending verification).
Naming drift flagged: PDF uses "Learning OS" — corrected to "Acta" / "Acta verification."
Expanded competitor set (8 beyond pre-approved 5) flagged as D-001, pending founder decision.

### 2026-05-11 — /build-feature instructor-student-demo-flow-polish — shipped
Frontend/copy/CSS polish only. No backend, schema, API, AI, prompt, provider, repo, route,
migration, or test changes.
Home rewritten as a real demo landing: one-line positioning, numbered demo strip
(5 steps), three role cards (Instructor demo / Student demo / Ledger placeholder).
Top nav extracted into `<TopNav>` client component with active-link state (bold +
underline) and a small "verification layer" brand subline.
Workspace badges added across all role pages — `Instructor Workspace`,
`Student Workspace`, `Submission Review · Instructor View / Student View`.
Section reorder on `/instructor/[id]`: Instructions → Rubric → AI help policy →
Verification mode → Instructor Solution Guide → Student submissions → Policy provenance
→ Version history (only when > 1 version). Each section has a one-line italic-grey
`section-helper` caption explaining what the section proves.
Section reorder on `/student/[id]`: Instructions → Rubric → **AI help rules** (extracted
`<PolicyBanner>` shown as its own card; the chat still renders its banner internally) →
Ask for guidance → Submit your work → My submissions. Helper copy across sections.
Submission viewer (`/submissions/[id]`) heading is now role-specific:
"Your Submission Review" (student) / "Student Submission Review" (instructor) with
role-tag subline ("Instructor View — read-only review" or "Student View"); helper copy
clarifies that the verification result is a SIGNAL for instructor review, never a final
grade.
Ledger page rewritten: "The provenance ledger is planned next. Current records are
already hash-pinned for future evidence." Includes a new "Hash-pinned today" card
listing existing anchors (policyHash, contentHash, referenceHash, concept-check and
verification pins).
Instructor-only reference-pin indicator added to concept-check set cards and
verification attempt cards: shows `Generated with Instructor Solution Guide v{n}` /
`Evaluated against Instructor Solution Guide v{n}` only when `viewerRole === "instructor"`
and the row has a non-null `referenceVersion`. Hidden from students. Only the integer
version and short hash (tooltip) are surfaced — raw reference content never exposed.
Button label refresh: "Create assignment policy", "Add Instructor Solution Guide",
"Edit Guide (creates new version)", "Submit my work". Back-link copy refreshed across
flows: "← Back to Instructor Workspace", "← Back to Student Workspace", role-specific
"Back to instructor/student assignment" on submission detail.
Empty-state copy improved across `/instructor`, `/student`, `SubmissionList`,
`ConceptCheckDisplay`, `ReferenceSolutionSection`.
CSS additions for `workspace-badge`, `page-sub`, `section-helper`, active top-nav,
demo strip, home cards, reference pin tag, verification subtitle, and ledger anchors.
Tests untouched. All 161 tests still pass. `pnpm lint` + `pnpm -r typecheck` clean.
`pnpm --filter @acta/frontend build` succeeds (11 routes; `/submissions/[id]` grew to
5.83 kB from 5.19 kB).
Scope held: no backend, schema, migration, API contract, AI, prompt, provider, repo,
route, or test changes. Student never sees Instructor Solution Guide content at any
layer. Role-specific submission links still use `?role=student` / `?role=instructor`.
No real student data, no secrets, no "legally admissible" language introduced.
Files updated: docs/ui-spec.md, docs/changelog.md, docs/sprint-backlog.md.
Frontend modified: src/frontend/app/{layout,page}.tsx,
src/frontend/app/instructor/{page,new/page,[id]/page,[id]/edit/page}.tsx,
src/frontend/app/student/{page,[id]/page}.tsx,
src/frontend/app/submissions/[id]/page.tsx,
src/frontend/app/ledger/page.tsx,
src/frontend/app/globals.css,
src/frontend/components/{submission-form,submission-list,concept-check-display,verification-result-display,reference-solution-section}.tsx.
Frontend added: src/frontend/components/top-nav.tsx.

### 2026-05-11 — /build-feature reference-rag-retrieval — shipped
Founder approved D-041 (pin nullable reference fields on new `concept_check_sets` +
`concept_check_verifications`; no backfill), D-042 (trusted INSTRUCTOR-REFERENCE block
ABOVE the submission block; submission and Q/A remain wrapped as untrusted), D-043
(strictly-additive no-reference fallback), D-044 (visible-but-minimal stub-provider
reference awareness — concept-check stub prepends one keyConcept question; verification
stub appends a deterministic annotation line; aggregation rules unchanged).
Implemented migration 0006 with three nullable columns + FK on each of the two existing
tables, Drizzle schema deltas, type extensions on `ConceptCheckSet` and
`ConceptCheckVerification`, reference-aware prompt builders for both concept-check
generation and verification grading, reference-aware stub providers (Anthropic providers
unchanged), repo `create()` signatures extended with `referencePin`, and route-layer
retrieval via `referenceSolutionsRepo.getCurrentByAssignment(...)` in both
`routes/concept-checks.ts` and `routes/concept-check-verifications.ts`. Server passes
`referenceSolutionsRepo` into both `buildConceptCheckRoutes` and
`buildConceptCheckVerificationRoutes`.
Frontend types extended for `ConceptCheckSet` and `ConceptCheckVerification` so the new
nullable pin fields parse cleanly in API responses. No UI behavior change.
Reserved ledger events for both `concept_check_set.created` and
`concept_check_verification.created` extended with `referenceSolutionId`,
`referenceVersion`, `referenceHash` (all nullable). Raw expectedSolution / keyConcepts /
requiredReasoningSteps / commonMistakes / correctnessCriteria / optionalNotes / student
content / answers / question prompts / feedback remain excluded.
Tests: 24 added across prompt builders (concept-check and verification), stub providers
(both), HTTP routes with and without reference, student-isolation regression, and
reserved-event TS pins. All 161 tests in the suite pass.
Manual (Python-driven) smoke: reference posted then concept-checks generated → pin
fields match the reference and first question has conceptTag `reference-key-concept`;
verification submitted → pin fields match and overallFeedback ends with "Reference
applied (vN, hash XXXXXXXX)."; another assignment without reference → pin fields all
null and first question uses an existing template; student GET reference → 404.
Frontend `pnpm --filter @acta/frontend build` succeeds; `pnpm lint` and
`pnpm -r typecheck` clean.
Existing rows from before this feature are not backfilled and continue to work with
null reference fields. Strictly-additive fallback preserves the pre-feature product
behavior for any tenant without a reference solution. No vector DB, no embeddings, no
chunking, no external RAG service, no new student-facing endpoints, no UI changes,
no ledger events emitted, no real student data, no secrets, no "legally admissible"
language introduced.
Files updated: docs/decisions.md (D-041–D-044), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ai-spec.md (retrieval section now
active), docs/product-requirements.md (R9), docs/user-stories.md, docs/test-plan.md,
docs/sprint-backlog.md, docs/changelog.md.
Source added: src/backend/src/db/migrations/0006_reference_pinning.sql,
tests/reference-rag-retrieval.test.ts. Source modified:
src/backend/src/db/schema.ts, src/backend/src/lib/types.ts,
src/backend/src/lib/concept-check-prompt-builder.ts,
src/backend/src/lib/verification-prompt-builder.ts,
src/backend/src/ai/concept-check/{types,stub-concept-check-provider}.ts,
src/backend/src/ai/verification/{types,stub-verification-provider}.ts,
src/backend/src/repo/concept-check-sets-{repo,memory-repo,pg-repo}.ts,
src/backend/src/repo/concept-check-verifications-{repo,memory-repo,pg-repo}.ts,
src/backend/src/routes/concept-checks.ts,
src/backend/src/routes/concept-check-verifications.ts,
src/backend/src/server.ts,
src/frontend/lib/types/assignment.ts.

### 2026-05-11 — /build-feature instructor-reference-rag — shipped
Founder approved D-038 (append-only reference versions; current = MAX(version)),
D-039 (body limits — `expectedSolution` ≤ 50K, `correctnessCriteria` ≤ 10K,
`optionalNotes` ≤ 10K, lists ≤ 50 entries with per-entry caps),
D-040 (SHA-256 hex `referenceHash` of canonical JSON; list order is meaningful).
Implemented `assignment_reference_solutions` table with FK to `assignments`
(ON DELETE RESTRICT) + migration 0005, canonical-JSON SHA-256 helper, zod validator,
append-only repo interface (no UPDATE/DELETE and no `studentId` parameter anywhere),
in-memory + Postgres repo impls with transactional `MAX(version)+1` computation, three
instructor-only routes (`GET`, `POST`, `GET .../versions[?version=N]`) with
privacy-pattern 404s for students and cross-tenant. Backend boot logs the new repo.
Frontend: extended types + api-client with reference-solution helpers; new
`reference-solution-section.tsx` component (create / view / edit / version history /
inline historical-version viewer) mounted only on `/instructor/[id]` under a card
titled "Instructor Solution Guide". No student-facing page imports the component.
Reserved ledger event `assignment_reference_solution.created` documented (hash + ids
only; never raw `expectedSolution`, `keyConcepts`, `requiredReasoningSteps`,
`commonMistakes`, `correctnessCriteria`, or `optionalNotes`).
Tests: 24 added (8 validator, 4 reference-hash including order-meaningful, 11 HTTP
routes including 401, student GET/POST/list 404s, cross-tenant 404, GET-before-any
404, append-only with v1 unchanged after v2, list newest-first, ?version=N unknown
404, repo lockdown, reserved-event purity TS pin). All 137 tests in the suite pass.
Manual (Python-driven) smoke: instructor POST v1 → 201; student GET / POST → 404;
cross-tenant GET → 404; v2 created with new hash; GET current returns v2; GET
?version=1 returns the original v1 unchanged; versions list returns `[2, 1]`.
Frontend `pnpm --filter @acta/frontend build` succeeds.
No prompt changes: `buildConceptCheckSystemPrompt` and `buildVerificationSystemPrompt`
are unchanged. No provider behavior changes. Retrieval into prompts is scoped to the
follow-up feature `reference-rag-retrieval`.
No real student data; no secrets committed; no "legally admissible" language introduced;
no ledger events emitted; no AI detection, plagiarism, LMS, evidence export, or
dashboard added.
Files updated: docs/decisions.md (D-038–D-040), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ai-spec.md (trusted/untrusted
boundary), docs/ui-spec.md (Screen 12), docs/product-requirements.md (R8),
docs/user-stories.md, docs/test-plan.md, docs/sprint-backlog.md, docs/changelog.md.
Source added: src/backend/src/db/migrations/0005_assignment_reference_solutions.sql,
src/backend/src/lib/reference-hash.ts,
src/backend/src/lib/validators/reference-solution.ts,
src/backend/src/repo/reference-solutions-{repo,memory-repo,pg-repo}.ts,
src/backend/src/routes/reference-solutions.ts; extended schema/types/server;
src/frontend/components/reference-solution-section.tsx; extended types/api-client;
appended CSS; mounted section on src/frontend/app/instructor/[id]/page.tsx;
tests/instructor-reference-rag.test.ts.

### 2026-05-11 — /build-feature text-verification-grading — shipped
Founder approved D-033 (append-only verification attempts), D-034 (5,000-char per-answer
cap), D-035 (deterministic stub evaluator with length thresholds + unique-word floor),
D-036 (Anthropic conservative downgrade on incomplete output), D-037 (delimited
untrusted-data wrappers around both submission and Q/A in the evaluator prompt). Reuses
D-022 (provider selection), D-026 (default model), D-003 (synthetic-only), D-019 (404
privacy semantics), D-031 (append-only pattern), D-032 (deterministic stub pattern).
Implemented `concept_check_verifications` table with FKs to `assignments`, `submissions`,
`concept_check_sets`, and `assignment_policy_versions` (all ON DELETE RESTRICT) + migration
0004, deterministic prompt builder with two delimited untrusted-data blocks, stub + Anthropic
verification providers + selector, append-only repo interface (no UPDATE/DELETE), in-memory
+ Postgres repo impls, three routes (`POST /v1/concept-check-sets/:id/verifications`,
`GET /v1/concept-check-sets/:id/verifications`, `GET /v1/verifications/:id`) with role
filters and D-019 privacy semantics (404, not 403). Cross-check at the route layer rejects
missing/unknown/duplicate question IDs BEFORE calling the evaluator. Backend boot logs which
verification provider is selected.
Frontend: extended types + api-client with verification helpers; new `verification-form.tsx`
(textarea per question, submit disabled until all answers non-empty) and
`verification-result-display.tsx` (colored result badge, overall feedback, per-question
status pills + feedback); refactored `concept-check-display.tsx` into a per-set sub-component
that loads and renders verification attempts; CSS appended for badges, pills, and form.
Reserved ledger event `concept_check_verification.created` documented (hashes/ids/result/
provider/model/timestamp only — NEVER raw answers, raw feedback, raw submission content,
or raw question prompts).
Tests: 27 added (6 validator, 1 prompt-builder including injection-ordering, 4 stub
evaluator including determinism + short→fail + detailed→pass + mixed→needs_review,
15 HTTP routes including auth, cross-tenant, non-owner student, instructor-POST 404,
missing/unknown/duplicate validation, snapshot pins, short vs. detailed, append-only,
instructor list, single-row access matrix, repo interface lockdown, and reserved-event
purity TS pin). All 113 tests in the suite pass.
Manual smoke (Python-driven): long answers → `pass`; short answers → `fail`; instructor
POST → 404; missing answer → 400 `missing_answers`; unknown questionId → 400
`unknown_question_id`; instructor list returns 2 attempts; student list returns 2.
Frontend `pnpm --filter @acta/frontend build` succeeds; `/submissions/[id]` route grew to
5.11 kB on the production bundle.
No real student data; no secrets committed; no "legally admissible" language introduced;
no ledger events emitted.
Files updated: docs/decisions.md (D-033–D-037), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ai-spec.md, docs/ui-spec.md,
docs/product-requirements.md, docs/user-stories.md, docs/test-plan.md,
docs/sprint-backlog.md, docs/changelog.md.
Source added: src/backend/src/db/migrations/0004_concept_check_verifications.sql;
src/backend/src/lib/verification-prompt-builder.ts;
src/backend/src/lib/validators/concept-check-verification.ts;
src/backend/src/ai/verification/{types,stub-verification-provider,anthropic-verification-provider,select-verification-provider}.ts;
src/backend/src/repo/concept-check-verifications-{repo,memory-repo,pg-repo}.ts;
src/backend/src/routes/concept-check-verifications.ts;
extended schema/types/server;
src/frontend/components/{verification-form,verification-result-display}.tsx;
refactored src/frontend/components/concept-check-display.tsx;
extended src/frontend/lib/types/assignment.ts and src/frontend/lib/api-client.ts;
appended CSS in src/frontend/app/globals.css;
tests/concept-check-verification.test.ts.

### 2026-05-11 — /build-feature submission-grounded-concept-checks — shipped
Founder approved D-030 (default questionCount=4, range 1..8), D-031 (append-only sets),
D-032 (stub provider deterministic per submissionContentHash + questionCount). Reuses
D-022 (provider selection), D-026 (default model), D-003 (synthetic-only).
Implemented `concept_check_sets` table with FKs to `assignments`, `submissions`, and
`assignment_policy_versions` (all ON DELETE RESTRICT) + migration 0003, deterministic
prompt builder that wraps the student submission in `<<<SUBMISSION-START`/`SUBMISSION-END>>>`
delimiters and explicitly declares the block untrusted data, stub + Anthropic concept-check
providers + selector, append-only repo interface (no UPDATE/DELETE), in-memory + Postgres
impls, route trio `POST /v1/submissions/:id/concept-checks` (student-owner only) plus
`GET /v1/submissions/:id/concept-checks` and `GET /v1/concept-check-sets/:id` with role
filters and D-019 privacy semantics (404, not 403). Added
`assignmentsRepo.getByTenantIdVersion(tenantId, id, version)` so the route resolves
the submission's pinned historical policy version rather than the current one.
Frontend: extended types + api-client; new `concept-check-display.tsx` component; added
"Concept checks" section to `/submissions/[id]` showing Generate button + 1..8 numeric
control for student-owner and read-only list for instructor; CSS styles appended.
Reserved ledger event `concept_check_set.created` documented (hashes/ids/counts only —
NEVER raw content or raw prompts).
Tests: 23 added (6 prompt builder including prompt-injection-data ordering, 3 stub
provider including determinism, 13 HTTP routes including bounds, drift integrity, repo
append-only invariant, single-set access matrix, and reserved-event purity TS pin). All
86 tests in the suite pass.
Manual: backend boot 200; student POST 201 with snapshot fields matching submission;
instructor POST 404; instructor list returns 1; 400 on questionCount=99.
No real student data; no secrets committed; no "legally admissible" language introduced.
Files updated: docs/decisions.md (D-030–D-032), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ai-spec.md, docs/ui-spec.md,
docs/product-requirements.md, docs/user-stories.md, docs/test-plan.md,
docs/sprint-backlog.md, docs/changelog.md.
Source added: src/backend/src/db/migrations/0003_concept_check_sets.sql,
src/backend/src/lib/concept-check-prompt-builder.ts,
src/backend/src/lib/validators/concept-check.ts,
src/backend/src/ai/concept-check/{types,stub-concept-check-provider,anthropic-concept-check-provider,select-concept-check-provider}.ts,
src/backend/src/repo/concept-check-sets-{repo,memory-repo,pg-repo}.ts,
src/backend/src/routes/concept-checks.ts; extended schema/types/server/assignments-repo;
src/frontend/components/concept-check-display.tsx;
expanded /submissions/[id] page; tests/concept-check-generation.test.ts.

### 2026-05-11 — /build-feature student-submission — shipped
Founder approved D-027 (append-only submissions), D-028 (200,000 char limit), D-029
(SHA-256 hex content hash). Implemented `submissions` table (FK to `assignments` and
`assignment_policy_versions` ON DELETE RESTRICT) + migration 0002, content-hash helper,
zod validator, submissions-repo interface intentionally without update/delete methods,
in-memory + Postgres impls, full CRUD routes (POST 201 / GET list / GET single)
replacing the prior 501 stub, role-aware filters (instructor sees all in tenant;
student sees only own; cross-tenant 404; student-A reading student-B → 404).
Snapshot capture at submission time freezes `policyVersionId` / `policyVersion` /
`policyHash` on the row; FK chain to immutable `assignment_policy_versions` keeps
provenance unbreakable. Re-submission appends a new row; prior submissions remain
queryable and retain their original policy pin.
Frontend: added `Submit your work` form + `My submissions` list on /student/[id],
`Student submissions` section on /instructor/[id], and a new /submissions/[id]
viewer page (works for either role via tried-instructor-then-student fetch).
Reserved ledger event `submission.created` documented in api-contracts.md — raw
content is NEVER included; `contentHash` is the anchor.
Tests: 20 added (4 content-hash + 4 validator + 11 HTTP + 1 reserved-event shape
purity). All 63 tests in the suite pass.
Manual: backend boot 200; student POST 201 with snapshot fields; instructor POST 403
`student_only`; student list returns own only (1 item); instructor list returns all
(1 item in this run). No real student data, no secrets committed, no
"legally admissible" language introduced.
Files updated: docs/decisions.md (D-027–D-029), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ui-spec.md, docs/product-requirements.md,
docs/user-stories.md, docs/test-plan.md, docs/sprint-backlog.md, docs/changelog.md.
Source added: src/backend/src/db/migrations/0002_submissions.sql,
src/backend/src/lib/content-hash.ts, src/backend/src/lib/validators/submission.ts,
src/backend/src/repo/submissions-{repo,memory-repo,pg-repo}.ts; rewrote
src/backend/src/routes/submissions.ts; extended schema/types/server;
src/frontend/components/{submission-form,submission-list}.tsx,
src/frontend/app/submissions/[id]/page.tsx, expanded /student/[id] and /instructor/[id];
tests/student-submission.test.ts.

### 2026-05-10 — /build-feature student-guided-help — shipped
Founder approved D-022 through D-026 (stub-by-default AI provider with Anthropic real
path on `ANTHROPIC_API_KEY`; stateless v1 chat; `X-Acta-Student-Id` placeholder auth;
disallowed requestType returns 400 without calling provider; default dev model
claude-haiku-4-5-20251001).
Implemented: prompt-builder with policy-aware system prompt + hard-rule sentence, zod
help-request validator, extended auth helper, AssignmentsRepo `listByTenant` +
`getByTenantId` (memory + Postgres impls), AI provider interface + stub provider
(deterministic, refuses final-answer triggers under any requestType including
"general") + Anthropic provider (real `@anthropic-ai/sdk` calls) + provider selector
(stub when key missing), Fastify routes `POST /v1/assignments/:id/help` and
`GET /v1/student/assignments[/:id]`. Server wires repo + provider + CORS for student
header.
Frontend: replaced /student placeholder with student list and chat pages, HelpChat /
HelpRequestTypePicker / PolicyBanner components, drift banner when policyVersionId
changes mid-conversation, "Hard rule" badge on Restrict final answer, disabled chip
state for disallowed help types with tooltip.
Reserved ledger event shapes documented (chat.session.started, chat.message,
chat.policy.drift) — NOT emitted.
Tests: 43 pass (4 foundation + 16 assignment-policy + 23 student-guided-help) covering
prompt builder, stub provider, auth, tenant scoping, disallowed requestType returns
400 + does NOT call provider, general loophole closed, validation errors, unknown id,
cross-tenant, drift detection across PUT, student list + getByTenantId.
Manual: backend boot logs "ANTHROPIC_API_KEY not set — using deterministic stub
provider (D-022)"; healthz 200; hint allowed returns answered with policyVersion +
policyHash; debugging disallowed returns 400 help_type_not_allowed; general
final-answer trigger returns refused with outcomeReason.
ai-spec.md documents v2 hardening gap (post-generation classifier) for transparency.
Files updated: docs/decisions.md, docs/api-contracts.md, docs/ui-spec.md,
docs/ai-spec.md, docs/architecture.md, docs/test-plan.md, docs/changelog.md,
docs/sprint-backlog.md, .env.example. Source added: src/backend/src/ai/providers/*,
src/backend/src/lib/prompt-builder.ts, src/backend/src/lib/validators/help-request.ts,
src/backend/src/routes/help.ts, src/backend/src/routes/student.ts, expanded
src/backend/src/lib/{types,auth-placeholder,env}.ts, expanded repo,
src/frontend/app/student/*, src/frontend/components/{policy-banner,help-request-type-picker,help-chat}.tsx,
tests/student-guided-help.test.ts.

### 2026-05-10 — /build-feature teacher-assignment-policy — shipped
Founder approved version-preserving two-table schema (D-018) and L3 picks D-016–D-021.
Implemented: Drizzle schema (`assignments` + `assignment_policy_versions`), migration
0001, in-memory and Postgres repos (interface-based; backend falls back to memory when
DB unreachable in dev), zod validation, canonical-JSON SHA-256 `policy_hash`,
placeholder header auth (D-020), CORS hook (dev only), Fastify routes
(`GET / POST /v1/assignments`, `GET /:id`, `GET /:id?version=N`, `GET /:id/versions`,
`PUT /:id`), instructor UI (list / new / view / edit) with grading-mode selector
and AI-help policy controls, version history disclosure, historical version banner.
Reserved ledger event shapes (`assignment.policy.created`, `assignment.policy.updated`)
documented in api-contracts.md and architecture.md — NOT emitted.
Tests: 20 pass (4 foundation + 16 assignment-policy). Coverage includes order-independent
hash, hash uniqueness across versions, validators, 401 on missing headers, POST/GET
roundtrip, PUT preserves prior version + bumps current_version, historical version
retrieval, version list endpoint, cross-tenant 404 (not 403) for read/list/historical,
body cannot override tenant/instructor, invalid mode → 400, unknown id/version → 404.
Manual: backend boots, healthz 200, /v1/assignments 401 without auth, 200 with auth.
Files updated: docs/decisions.md (D-016–D-021), docs/database-schema.md,
docs/api-contracts.md, docs/architecture.md, docs/ui-spec.md, docs/product-requirements.md,
docs/user-stories.md, docs/sprint-backlog.md, docs/market-research.md (D-002 cleanup).
Source added: src/backend/src/{db,repo,lib,routes}/*, src/frontend/{app/instructor,components,lib}/*,
tests/assignment-policy.test.ts.

### 2026-05-10 — /build-feature project-foundation — scaffolding shipped
Founder approved scaffolding-only carve-out and L3 tech stack picks (D-007 through D-015).
Foundation created: pnpm workspace root, src/frontend (Next.js 14 App Router),
src/backend (Fastify), src/ai (synthetic-only placeholder), tests/, scripts/, GitHub
Actions CI (lint + typecheck + smoke), docker-compose.yml (LOCAL DEV ONLY for Postgres),
Biome config, Vitest config, .env.example (synthetic-data-only enforced).
No product logic. No real student data. No real ledger writes. No real AI calls.
No "legally admissible" language in any source file. No secrets committed.
Files updated: docs/decisions.md, docs/file-structure.md, docs/architecture.md,
docs/test-plan.md, .env.example, docs/sprint-backlog.md, docs/changelog.md.

### 2026-05-10 — Pre-build decisions resolved — chief-of-staff-orchestrator
Founder resolved remaining pre-build decisions. D-002 finalized (no "legally admissible";
use audit-ready / evidence-ready / provenance-backed / defensible record). D-003 resolved:
synthetic data only for MVP development; Anthropic Claude as preferred dev provider;
real-data work gated on signed DPA before pilot. D-005 finalized (soft internal cost
target, not external pricing). Q5 resolved: standalone-first for v1; LTI 1.3 deferred
to v1.5 after pilot validation. D-006 resolved: clean higher-ed SaaS dashboard style —
trustworthy, minimal, professional, evidence-oriented, department-chair friendly; avoid
K-12 / futuristic AI / consumer chatbot styling.
With these decisions, /build-feature project-foundation is unblocked for synthetic-data
development. Pilot launch remains gated on signed Anthropic (or alternative) DPA.

### 2026-05-10 — Phase 2 → Phase 3 gate — chief-of-staff-orchestrator — Option A APPROVED
Founder approved Option A as the v1 build target. Phase 3 unlocked. Architecture work
(software-architect-agent + ai-llm-engineer-agent on ledger design) cleared to begin.
Real-student-data integration remains blocked until D-003 (model provider + FERPA DPA)
is resolved. Binding constraints recorded with the approval:
- Positioning language: do not use "legally admissible"; use "audit-ready,"
  "evidence-ready," "provenance-backed," or "defensible record." (D-002 closed.)
- $7/student/month is a soft internal cost target, not external pricing. (D-005 closed.)
- Option B = v2/post-MVP; Option C = v1.5/post-MVP.
- Full LTI 1.3, full accreditation automation, full EU AI Act compliance automation are
  explicitly NOT v1.
Files updated: docs/decisions.md, docs/final-mvp-plan.md, docs/mvp-scope.md,
docs/not-building.md, docs/sprint-backlog.md, docs/changelog.md.

### 2026-05-10 — Phase 2 complete — product-manager-agent — /select-mvp delivered; Option A recommended
Q4 resolved: oral verification deferred from v1 (text-first; architecture leaves room for
browser WebRTC later). Q4 rejections recorded: Zoom/Teams, native app, required live oral.
/select-mvp scored Options A/B/C with 0.35/0.25/0.20/0.10/0.10 weights. Option A = 8.00,
Option B = 8.25 (ineligible — Q4 defers oral), Option C = 6.40. Option A is the recommended
v1 MVP. Option B reframed as post-MVP expansion. Option C reframed as v1.5 expansion.
Files updated: docs/decisions.md, docs/final-mvp-plan.md, docs/mvp-scope.md, docs/not-building.md,
docs/sprint-backlog.md, docs/changelog.md.
Final founder DECISION REQUIRED logged: approve Option A as the v1 build target.

### 2026-05-05 — Phase gate — chief-of-staff-orchestrator — Q1/Q2/Q3 resolved; Phase 2 unblocked
Founder answered all three blocking open questions. Q1 = department chair / program director
(primary buyer); faculty (secondary user); students (end user). Q2 = professional graduate
programs, especially online-heavy nursing, law, MBA, cybersecurity, data/AI.
Q3 = data flywheel + institutional ledger switching cost (candidates A + C combined).
Six explicit non-ICP/non-beachhead exclusions recorded in docs/decisions.md and docs/icp.md.
D-006 (demo audience) partially resolved: audience = dept chair / program director.
Phase 1 → Phase 2 gate: UNBLOCKED. /select-mvp can now run.
Files updated: docs/decisions.md, docs/icp.md, docs/changelog.md, docs/sprint-backlog.md.

### 2026-05-05 — Phase 1 complete — all agents — /research-mvp delivered
Six agents delivered Phase 1 outputs. External web verification completed for priority claims.
Files updated: docs/market-research.md, docs/competitor-map.md, docs/source-log.md,
docs/research-claims.md, docs/customer-discovery.md, docs/interview-questions.md,
docs/ai-spec.md, docs/security-review.md, docs/demo-flow.md,
docs/research-backed-mvp-options.md, docs/decisions.md.
Phase gate blocked: Q1, Q2, Q3 still Open. Founder must answer before /select-mvp runs.
6 Level 3 decisions pending (D-001 through D-006). See docs/decisions.md.

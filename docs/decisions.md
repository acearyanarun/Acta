# Decisions

**Purpose:** Single log of all Level 3 decisions and Q1–Q6 open questions.
**Owner:** chief-of-staff-orchestrator
**Last updated:** 2026-05-05
**Status:** Active — Phase 2 complete; Option A APPROVED 2026-05-10; Phase 3 unlocked (conditional on D-003)

---

## Open questions (Q1–Q6)

| ID | Question | Status | Decision | Date |
|----|----------|--------|----------|------|
| Q1 | Primary buyer / ICP | **Resolved** | Department chair / program director (primary buyer); faculty (secondary user); students (end user). See full decision below. | 2026-05-05 |
| Q2 | Beachhead segment | **Resolved** | Professional graduate programs, especially online-heavy programs in nursing, law, MBA, cybersecurity, data/AI, and other high-stakes applied fields. See full decision below. | 2026-05-05 |
| Q3 | Third moat | **Resolved** | Combination of: A) Data flywheel from verification interactions and C) Institutional ledger switching cost. See full decision below. | 2026-05-05 |
| Q4 | Live oral assessment delivery method | **Resolved** | Not core v1. Text-first verification. Architecture leaves room for future browser WebRTC. | 2026-05-10 |
| Q5 | LMS integration depth for v1 | **Resolved** | Standalone-first for v1. LTI 1.3 / LMS integration deferred to v1.5 after pilot validation. | 2026-05-10 |
| Q6 | Institutional vs. instructor pilot model | **Partial** | Demo audience = department chair / program director (follows from Q1). Full pilot model decision still open. | 2026-05-05 |

---

## Phase gate status

| Phase | Gate | Status |
|-------|------|--------|
| Phase 1 → Phase 2 | Q1, Q2, Q3 answered by founder | **UNBLOCKED** — resolved 2026-05-05 |
| Phase 2 → Phase 3 | MVP scope founder-approved | **UNBLOCKED** — Option A approved 2026-05-10. Architecture work may begin. **Real-student-data work blocked until D-003 (model provider FERPA DPA) is resolved.** |
| Phase 3 → Phase 4 | Build complete, go/no-go | Blocked — Phase 3 in progress |

---

## Level 3 decisions — pending

### D-001 — Expanded competitor set
**Triggered by:** market-research-agent, Phase 1
**Question:** Approve or reject 8 additional competitors (QuadC, Blackboard/Anthology, Cognii,
Packback, Risely AI, DRUID AI, IU Syntea, UCSD SLH) for inclusion in the primary research set.
**Status:** Awaiting founder decision
**Recommendation:** Keep pre-approved 5 as primary; treat additional 8 as reference-only.
Elevate Cognii to secondary research priority regardless of set decision (closest competitor
to Acta's core verification thesis).
**Default if founder uncertain:** Reference-only (do not expand primary set yet).

### D-002 — Legal admissibility language
**Triggered by:** qa-security-devops-agent, Phase 1
**Resolved:** 2026-05-10 (re-confirmed and finalized)
**Decision:** Remove "legally admissible" from all product, demo, pitch, and documentation
language until legal review is complete. Approved alternatives: "audit-ready,"
"evidence-ready," "provenance-backed," "defensible record."
**Reason:** Legal admissibility is a legal claim and should not be used in v1 without a
formal legal opinion. The ledger's technical properties (hash chain, signing, append-only)
are real and can be described directly; the legal conclusion requires a lawyer.
**Binding on:** All agents. All existing docs to be audited and updated.

### D-003 — Model provider + FERPA DPA
**Triggered by:** qa-security-devops-agent, Phase 1
**Resolved:** 2026-05-10
**Decision:** For MVP development, use SYNTHETIC / DEMO data only until a model provider
and FERPA-compatible DPA are confirmed.
- **Preferred development provider:** Anthropic Claude for development and testing.
- **Production / pilot requirement:** Do NOT process real student PII or real student
  submissions until vendor terms, data retention, FERPA school-official posture, and
  DPA requirements are reviewed and a signed DPA is in place.
**Reason:** This unblocks MVP development without exposing real student data. Architecture,
schemas, prompts, and evals can proceed against synthetic fixtures. Pilot launch is the
gate at which the DPA must be in place.
**Binding on:** ai-llm-engineer-agent (use Claude for dev; synthetic data only),
qa-security-devops-agent (enforce no-real-data gate; review vendor terms before pilot),
backend-developer-agent (cannot wire real-data integration without confirmation).
**Outstanding sub-tasks:**
- qa-security-devops-agent: review Anthropic vendor terms (data retention, training,
  enterprise/zero-retention options) and confirm FERPA school-official posture is achievable.
- Founder: sign DPA with Anthropic (or selected production provider) before first pilot
  with real students.

### D-004 — EU AI Act: "Required gate" mode and human oversight
**Triggered by:** qa-security-devops-agent, Phase 1
**Question:** The EU AI Act Annex III requires human oversight of AI assessments before
they become final. The "required gate" grading mode (hard gate, no instructor override)
may conflict. Should the mode include an instructor override option for EU compliance?
**Status:** Awaiting founder decision
**Tension:** Adding override may add instructor burden (C6); not adding it risks EU compliance.
**Recommendation:** Add a low-friction instructor override (single-click review) that is
optional but available. This satisfies EU AI Act without adding meaningful burden.

### D-005 — $7/student/month inference cost target
**Triggered by:** ai-llm-engineer-agent, Phase 1
**Resolved:** 2026-05-10 (finalized)
**Decision:** Treat $7/student/month as a SOFT internal cost target — not a hard promise,
and not customer-facing pricing.
**Reason:** It should guide routing, caching, and cost planning, but pricing should not
be claimed until real usage is measured. Hard-coding $7 as a contract or marketing claim
before measurement creates a commitment we cannot verify.
**Binding on:** ai-llm-engineer-agent (design routing to track this internally),
product-manager-agent (do NOT use this number in any external sales/pricing material).

### D-006 — Demo audience and visual direction
**Triggered by:** ux-ui-designer-agent, Phase 1
**Question:** Who is the primary audience for the first demo (faculty, provost, investor)?
What visual direction (formal/trustworthy, modern/minimal, other)?
**Status:** Partially answered — demo audience resolved by Q1; visual direction still open.
**Partial resolution (2026-05-05):** Q1 decision establishes demo audience = department chair /
program director. Demo tone: emphasize grade defensibility, accreditation evidence, program
accountability. NOT faculty time-saved. NOT provost enterprise pitch.
**Remaining open:** Visual direction (formal/trustworthy vs. modern/minimal). Awaiting founder.

---

## Level 3 decisions — resolved

### MVP-APPROVAL — Option A approved as v1 build target
**Resolved:** 2026-05-10
**Decision:** Option A (verification-first, text-only) is approved as the v1 MVP.
Build Phase 3 is unlocked. Architecture work begins. Real-student-data integration
remains blocked until D-003 (model provider + FERPA DPA) is resolved.

**Approved v1 thesis (founder language — to be used verbatim in positioning):**
> Acta lets educators allow AI help while requiring students to prove understanding
> through text-first, submission-grounded concept checks, configurable verification
> modes, and a provenance-backed ledger.

**Approved v1 scope (founder language):**
1. Teacher assignment policy configuration
2. Course / assignment grounding
3. Student guided-help experience
4. Submission-grounded concept checks
5. Three verification modes: score, gate, fail-only
6. Required-gate instructor override
7. Provenance-backed ledger
8. Evidence / export report
9. Basic teacher review dashboard
10. Standalone-first architecture
11. Reserved fields for future oral/WebRTC and LMS expansion

**Not in v1 (founder-stated exclusions):**
- Oral / WebRTC verification
- Zoom / Teams integration
- Native app
- Deep LMS integration
- Full LTI 1.3 integration (stub-only is acceptable; full integration is v1.5)
- AI detection / classifier product (C4 — never)
- Legal admissibility claims
- Full accreditation automation
- Full EU AI Act compliance automation

**Roadmap framing (founder-stated):**
- Option B = v2 / post-MVP
- Option C = v1.5 / post-MVP

**Positioning language constraints (founder-stated, binding on all agents):**
- Do NOT use "legally admissible."
- Approved alternatives: "audit-ready," "evidence-ready," "provenance-backed,"
  "defensible record." This supersedes any prior wording in market-research.md,
  research-backed-mvp-options.md, demo-flow.md, security-review.md, and final-mvp-plan.md.
  D-002 is now closed via this language constraint (legal review still recommended
  before any future stronger claim).

**Cost target framing (founder-stated, binding on all agents):**
- $7/student/month is a SOFT internal cost target, not an external pricing claim.
- D-005 is now closed: soft target. ai-llm-engineer-agent must design model routing
  to track this number internally; product-manager-agent must NOT use it in any
  external pricing or sales material.

**Data handling constraint (founder-stated, binding):**
- No real student data may enter any pipeline until D-003 (model provider FERPA DPA)
  is resolved. Architecture, schemas, prompts, and evals may proceed using synthetic
  data only. This is a hard gate enforced by qa-security-devops-agent.

**Activation effects:**
- Phase 3 backlog activates in docs/sprint-backlog.md
- software-architect-agent + ai-llm-engineer-agent begin ledger design (must precede
  frontend / backend parallel tracks)
- product-manager-agent finalizes docs/product-requirements.md and docs/user-stories.md
- qa-security-devops-agent enforces "no real student data" gate

---

### Q1 — Primary buyer / ICP
**Resolved:** 2026-05-05
**Decision:** Department chair / program director is the primary buyer.
- Primary buyer: Department chair / program director (holds budget, owns curriculum quality and accreditation accountability)
- Secondary user: Faculty (configures assignments, reviews ledger, defends grades)
- End user: Students (receives concept checks, completes verification)

**Explicit exclusions (founder-recorded):**
- Faculty are an important user and early champion, but NOT the primary buyer.
- Provosts may become later-stage enterprise buyers, but are NOT the first ICP.
- LMS partners and accreditation bodies are NOT the first buyer.

**Implication for MVP:** Demo persona should be a department chair / program director.
Hero moment is grade defense and accreditation evidence — not time-saved-by-faculty.
D-006 (demo audience) is partially answered: audience = dept chair / program director.

---

### Q2 — Beachhead segment
**Resolved:** 2026-05-05
**Decision:** Professional graduate programs, especially online-heavy programs in nursing,
law, MBA, cybersecurity, data/AI, and other high-stakes applied fields.

**Reasoning:** These segments have the highest pain acuity — grade appeals are high-stakes,
professional licensing boards demand evidence of competency, and online delivery creates
the highest verification pressure. These programs have budget and procurement authority
closer to the program director than R1 research departments.

**Explicit exclusions (founder-recorded):**
- Online-only and professional graduate programs are the first beachhead.
- R1 universities are NOT the first beachhead.
- Community colleges are NOT the first beachhead.
- K-12 is NOT the first beachhead.

**Implication for MVP:** Option B (oral verification) is now strategically higher priority —
nursing and law oral exams are a visceral fit. Q4 decision becomes more urgent.
Demo scenario should use a high-stakes professional grad assignment (e.g., clinical case
analysis, legal brief, or security incident response).

---

### Q5 — LMS integration depth for v1
**Resolved:** 2026-05-10
**Decision:** Standalone-first for v1. Add LTI 1.3 or LMS integration in v1.5 only after
pilot validation.
**Reason:** Deep LMS integration slows the MVP and is not necessary to prove the
verification-first thesis. Dept chair pilot can run on standalone deployment.
**Architectural implication:** Standalone deployment is the v1 default. LTI 1.3 stub
(metadata only — no grade passback, no roster sync) is acceptable as a reservation point.
Backend API surface should be designed so a future LTI 1.3 layer can wrap it without
schema changes.

---

### D-007 — Frontend framework
**Triggered by:** software-architect-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Next.js 14 (App Router) with TypeScript.
**Scope:** Foundation only. Production deployment platform remains deferred.

### D-008 — Backend framework
**Triggered by:** software-architect-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Separate Fastify backend (Node + TypeScript). Not Next.js API routes.
**Reason:** Keeps ledger crypto in a focused service; clean boundary for future extraction.

### D-009 — Database engine
**Triggered by:** software-architect-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Postgres. Required for row-level multi-tenant isolation (C5) and append-only ledger.

### D-010 — Database hosting (foundation only)
**Triggered by:** qa-security-devops-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Local Docker Postgres for foundation development only. Production database
provider remains deferred.

### D-011 — ORM
**Triggered by:** backend-developer-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Drizzle ORM. Migration-first; type-safe; lightweight.

### D-012 — Lint / format
**Triggered by:** qa-security-devops-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Biome (single tool for lint + format).

### D-013 — Test runner
**Triggered by:** qa-security-devops-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Vitest.

### D-014 — CI
**Triggered by:** qa-security-devops-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** GitHub Actions for lint, typecheck, and smoke tests only at foundation stage.
**Scope:** No deploy steps in CI yet. No secrets configured.

### D-016 — Storage for teacher-assignment-policy feature
**Triggered by:** software-architect-agent, /build-feature teacher-assignment-policy
**Resolved:** 2026-05-10
**Decision:** Drizzle ORM + Postgres (per D-009, D-010, D-011). First real schema lives here.
Backend falls back to an in-memory repo when `DATABASE_URL` is unreachable (dev convenience only).

### D-017 — ID format
**Triggered by:** software-architect-agent, /build-feature teacher-assignment-policy
**Resolved:** 2026-05-10
**Decision:** ULID for `assignments.id` and `assignment_policy_versions.id`.
**Reason:** Lexicographic time-ordering; no separate timestamp column needed for ordering.

### D-018 — Policy update semantics (amended from initial L3-c)
**Triggered by:** software-architect-agent + product-manager-agent
**Resolved:** 2026-05-10
**Decision:** **Version-preserving.** Two-table design — `assignments` (identity / current-version
pointer) + `assignment_policy_versions` (immutable rows, one per version). PUT inserts a NEW
version row and bumps `assignments.current_version` transactionally. No existing version row
is ever mutated or deleted by the app.
**Reason:** Provenance thesis requires proving which policy version existed at the time of
student interaction. Mutating in place would destroy that proof.
**Binding on:** backend-developer-agent (no UPDATE/DELETE against `assignment_policy_versions`
from app code), qa-security-devops-agent (test enforces this invariant).

### D-019 — Tenant boundary enforcement
**Triggered by:** software-architect-agent, /build-feature teacher-assignment-policy
**Resolved:** 2026-05-10
**Decision:** App-level tenant boundary via WHERE clauses in all queries for v1.
Postgres row-level security is a future hardening step when production DB provider is chosen.
Cross-tenant access returns 404 (not 403) to avoid confirming existence.

### D-020 — Placeholder auth shape
**Triggered by:** backend-developer-agent, /build-feature teacher-assignment-policy
**Resolved:** 2026-05-10
**Decision:** Two headers — `X-Acta-Tenant-Id` and `X-Acta-Instructor-Id`. Missing → 401.
Body values for tenant/instructor are ignored. Real auth provider remains deferred (L3).

### D-021 — restrictFinalAnswer semantic
**Triggered by:** product-manager-agent, /build-feature teacher-assignment-policy
**Resolved:** 2026-05-10
**Decision:** `restrictFinalAnswer` is a **hard policy requirement** captured in the
assignment policy data model. Enforcement is deferred to a future `student-guided-help`
feature (the AI pipeline). At this feature stage: capture, store, display clearly.
No AI enforcement built here.

### D-022 — AI provider integration mode (student-guided-help)
**Triggered by:** ai-llm-engineer-agent, /build-feature student-guided-help
**Resolved:** 2026-05-10
**Decision:** Stub provider by default; real Anthropic provider activates only when
`ANTHROPIC_API_KEY` is set. Stub returns deterministic canned responses (tests, demos,
no spend). Real-path adheres to D-003: synthetic data only.

### D-023 — Chat persistence in v1
**Triggered by:** software-architect-agent, /build-feature student-guided-help
**Resolved:** 2026-05-10
**Decision:** Stateless backend. Frontend holds the conversation. Backend reads the
current policy per turn and returns `policyVersionId`, `policyVersion`, `policyHash`
for the policy snapshot used on that turn. Frontend shows a drift banner if the
`policyVersionId` changes mid-conversation. No chat sessions or messages persisted
in this feature; that ships with the future ledger feature.

### D-024 — Student placeholder auth header
**Triggered by:** backend-developer-agent, /build-feature student-guided-help
**Resolved:** 2026-05-10
**Decision:** Extend D-020. Either `X-Acta-Instructor-Id` OR `X-Acta-Student-Id`
satisfies auth alongside the required `X-Acta-Tenant-Id`. Both routes never trust
identity values from request body.

### D-025 — Disallowed requestType handling
**Triggered by:** product-manager-agent + backend-developer-agent
**Resolved:** 2026-05-10
**Decision:** Returns `400 help_type_not_allowed` and does NOT invoke the AI provider.
Frontend shows the disabled chip + tooltip; this is a defense-in-depth check.

### D-026 — Default development model
**Triggered by:** ai-llm-engineer-agent, /build-feature student-guided-help
**Resolved:** 2026-05-10
**Decision:** `claude-haiku-4-5-20251001` is the default development model. Override
via `ANTHROPIC_MODEL` env. Synthetic data only (D-003).

### D-027 — Submission re-submission semantic
**Triggered by:** software-architect-agent, /build-feature student-submission
**Resolved:** 2026-05-10
**Decision:** Append-only. Every POST `/v1/assignments/:id/submissions` creates a new row.
The app NEVER UPDATEs or DELETEs `submissions` rows. Re-submission produces a new row;
prior submissions remain queryable for provenance.

### D-028 — Submission content size limit
**Triggered by:** backend-developer-agent, /build-feature student-submission
**Resolved:** 2026-05-10
**Decision:** 200,000 characters maximum for `content`. Larger payloads return 400.

### D-029 — Content hash algorithm
**Triggered by:** ai-llm-engineer-agent + software-architect-agent
**Resolved:** 2026-05-10
**Decision:** SHA-256 hex. Same primitive as `policy_hash`. Reused for the future ledger
event `submission.created` (anchor only — raw content is NEVER in ledger event shapes).

### D-030 — Concept-check set question count
**Triggered by:** product-manager-agent + ai-llm-engineer-agent, /build-feature submission-grounded-concept-checks
**Resolved:** 2026-05-11
**Decision:** Default `questionCount = 4`. Allowed range 1..8 (inclusive). Out-of-range values return 400.

### D-031 — Concept-check set re-generation semantic
**Triggered by:** software-architect-agent, /build-feature submission-grounded-concept-checks
**Resolved:** 2026-05-11
**Decision:** Append-only. Every POST `/v1/submissions/:id/concept-checks` creates a new
immutable `concept_check_sets` row. The app NEVER UPDATEs or DELETEs sets. Earlier sets
remain pinned to their original `submissionContentHash` and `policyVersionId`.

### D-032 — Stub concept-check provider determinism
**Triggered by:** ai-llm-engineer-agent, /build-feature submission-grounded-concept-checks
**Resolved:** 2026-05-11
**Decision:** The stub provider's question PROMPTS are deterministic per
`(submissionContentHash, questionCount)` — same submission + same count → same prompts.
Question IDs and `generatedAt` are not constrained to be deterministic (each set is its
own immutable row with fresh IDs). Enables reproducible tests and demos without spend.

### D-033 — Verification re-submission semantic
**Triggered by:** software-architect-agent, /build-feature text-verification-grading
**Resolved:** 2026-05-11
**Decision:** Append-only. Every POST `/v1/concept-check-sets/:id/verifications` creates
a new immutable `concept_check_verifications` row. The app NEVER UPDATEs or DELETEs
verification rows. Retries are new attempts; prior attempts remain queryable.

### D-034 — Max answer length
**Triggered by:** backend-developer-agent, /build-feature text-verification-grading
**Resolved:** 2026-05-11
**Decision:** 5,000 characters maximum per `answer.answer`. Larger payloads return 400.

### D-035 — Stub evaluator scoring heuristic
**Triggered by:** ai-llm-engineer-agent, /build-feature text-verification-grading
**Resolved:** 2026-05-11
**Decision:** Deterministic per `(answers, conceptCheckSetId)`. Per-question status:
trimmed length `< 40` → `insufficient`; `40..119` → `partial`; `≥ 120` AND
`uniqueWords ≥ 8` → `sufficient`; else `partial`. Aggregation: all `sufficient` → `pass`;
≥ 1 `insufficient` AND 0 `sufficient` → `fail`; else `needs_review`. Demo/test heuristic
only — NOT a pedagogical grading model.

### D-036 — Anthropic parser conservative downgrade
**Triggered by:** ai-llm-engineer-agent, /build-feature text-verification-grading
**Resolved:** 2026-05-11
**Decision:** If the Anthropic evaluator returns malformed JSON or an unknown `result`
value, throw (the route returns 500 — fail visibly, never persist garbage). If
`perQuestionFeedback` is missing rows, fill the missing rows with `partial` +
"no response in evaluator output", and downgrade the overall result to at most
`needs_review`. Never silently upgrade a missing-feedback set to `pass`.

### D-037 — Evaluator prompt embeds submission and answers as untrusted data
**Triggered by:** ai-llm-engineer-agent, /build-feature text-verification-grading
**Resolved:** 2026-05-11
**Decision:** Required for grounded evaluation. Submission content and Q/A pairs are
each wrapped in delimited untrusted-data blocks (`<<<SUBMISSION-START`/`SUBMISSION-END>>>`,
`<<<QA-START`/`QA-END>>>`). The prompt explicitly tells the model to ignore any
instructions inside those blocks. D-003 (synthetic-only) continues to bind.

### D-038 — Reference-solution versioning
**Triggered by:** software-architect-agent, /build-feature instructor-reference-rag
**Resolved:** 2026-05-11
**Decision:** Append-only versions. Each POST `/v1/assignments/:id/reference-solution`
creates a new immutable `assignment_reference_solutions` row with `version = MAX(prev) + 1`.
The app NEVER UPDATEs or DELETEs reference-solution rows. "Current" is resolved at read
time via `ORDER BY version DESC LIMIT 1`. No `current_version` pointer column.

### D-039 — Reference-solution body limits
**Triggered by:** backend-developer-agent, /build-feature instructor-reference-rag
**Resolved:** 2026-05-11
**Decision:**
- `expectedSolution` ≤ 50,000 chars
- `correctnessCriteria` ≤ 10,000 chars
- `optionalNotes` ≤ 10,000 chars (nullable)
- `keyConcepts` ≤ 50 entries, each ≤ 200 chars
- `requiredReasoningSteps` ≤ 50 entries, each ≤ 400 chars
- `commonMistakes` ≤ 50 entries, each ≤ 400 chars
All required text fields reject empty / whitespace-only values. Larger payloads return 400.

### D-040 — Reference hash algorithm and ordering
**Triggered by:** ai-llm-engineer-agent + software-architect-agent
**Resolved:** 2026-05-11
**Decision:** `referenceHash` = SHA-256 hex of canonical JSON of the hashable body. List
fields PRESERVE order (no sorting) because order is meaningful to instructors (priority
of concepts / reasoning steps). Reordering a list IS a meaningful change and produces a
new hash. Mirrors the `policy_hash` (D-029-adjacent) and `content_hash` (D-029) primitives.

### D-045 — Tenant-wide read methods on submissions / concept-check-sets / concept-check-verifications repos
**Triggered by:** backend-developer-agent, /build-feature basic-teacher-review-dashboard
**Resolved:** 2026-05-11
**Decision:** Add three read-only methods on existing repos:
- `submissionsRepo.listByTenantAcrossAssignments(tenantId, limit?)`
- `conceptCheckSetsRepo.listByTenantAcrossSubmissions(tenantId, limit?)`
- `conceptCheckVerificationsRepo.listByTenantAcrossSets(tenantId, limit?)`

Constraints: tenant-scoped only; no `studentId` parameter accepted anywhere on these
signatures; consumed only by the instructor dashboard route. Route layer remains
responsible for requiring instructor auth (D-019 / D-020). Existing student/instructor
access rules are unchanged. No mutation methods added.

### D-047 — Assignment-level AI-help master toggle
**Triggered by:** product-manager-agent + ux-ui-designer-agent, /build-feature ai-help-master-toggle
**Resolved:** 2026-05-11
**Decision:** Add `aiHelpEnabled: boolean` to `AssignmentPolicyVersion`. Master gate on
student-facing guided help for that policy version:

1. Stored on every policy version row (`ai_help_enabled` column on
   `assignment_policy_versions`, migration 0007, default `true`).
2. Hash-included in `computePolicyHash` so toggle changes produce a new `policyHash`
   even when every other field is identical.
3. Enforced by `POST /v1/assignments/:id/help`: when `aiHelpEnabled === false` the
   route returns `400 { error: "ai_help_disabled", policyVersionId, policyVersion,
   policyHash, message }` and never invokes any provider. This check runs BEFORE the
   per-type `help_type_not_allowed` check and applies unconditionally — `requestType="general"`
   (and the no-`requestType` case) cannot bypass it.
4. Default is `true` (validator + repo + DB column). No backfill required; pre-existing
   rows behave exactly as before.
5. Surfaced to instructors via the assignment form (radio group above per-type checkboxes;
   per-type controls visually + functionally disabled when off), the `task-card` Status
   row on `/instructor/[id]`, the AI help policy disclosure on `/instructor/[id]`, and the
   evidence-report policy snapshot.
6. Surfaced to students by gating `<HelpChat>` on `/student/[id]`. When off, the chat is
   replaced by an `<output class="policy-banner--disabled">` status banner reading "AI
   guided help is disabled for this assignment." `<PolicyBanner>` renders a single
   "AI help: Disabled" row when called with `aiHelpEnabled={false}`.

No new endpoint, no new ledger event, no AI behavior change.

### D-046 — Instructor dashboard privacy semantics
**Triggered by:** software-architect-agent, /build-feature basic-teacher-review-dashboard
**Resolved:** 2026-05-11
**Decision:** For `GET /v1/instructor/dashboard`:
- Missing auth headers → 401
- Student-only auth → 404 (D-019 privacy pattern)
- Instructor auth for a tenant with no data → 200 with empty/zero dashboard
- Instructor auth only ever returns data for THAT instructor's tenant
- No tenant id in URL or body; tenant always comes from the placeholder header

Returning 200-empty for an instructor on an unpopulated tenant matches the existing
tenant-scoped pattern (`GET /v1/student/assignments` returns `{items: []}`) and avoids
leaking whether OTHER tenants have data.

### D-041 — Reference pinning on generated rows
**Triggered by:** software-architect-agent, /build-feature reference-rag-retrieval
**Resolved:** 2026-05-11
**Decision:** Pin the current Instructor Solution Guide on new `concept_check_sets` and
`concept_check_verifications` rows via three nullable columns: `reference_solution_id`
(FK to `assignment_reference_solutions` ON DELETE RESTRICT), `reference_version`,
`reference_hash`. Existing rows are NOT backfilled. New rows created when no reference
exists persist nulls for all three.

### D-042 — Trusted block placement in evaluator prompts
**Triggered by:** ai-llm-engineer-agent, /build-feature reference-rag-retrieval
**Resolved:** 2026-05-11
**Decision:** When a reference solution exists, the trusted instructor context block is
inserted ABOVE the student SUBMISSION block (and ABOVE the QA block for verification).
The trusted block is delimited by `<<<INSTRUCTOR-REFERENCE-START` / `INSTRUCTOR-REFERENCE-END>>>`
and labeled as authoritative evaluation context that the model MUST NOT execute as instructions.

### D-043 — No-reference fallback is strictly additive
**Triggered by:** ai-llm-engineer-agent + software-architect-agent
**Resolved:** 2026-05-11
**Decision:** When no reference exists for the assignment, prompt builders omit the
trusted block entirely; stub providers run unchanged; Anthropic providers receive the
existing prompt shape; the new row persists nulls for the three pin fields. Tenants
without reference solutions experience NO behavior regression.

### D-044 — Stub-provider reference awareness (visible but minimal)
**Triggered by:** ai-llm-engineer-agent, /build-feature reference-rag-retrieval
**Resolved:** 2026-05-11
**Decision:**
- Concept-check stub: when a reference exists with ≥ 1 entry in `keyConcepts` OR
  `requiredReasoningSteps`, prepend ONE deterministic question that references the
  first such entry; the remaining `N-1` questions use the existing snippet-template
  list. When no reference exists, behavior is unchanged.
- Verification stub: existing length-threshold heuristic and pass/needs_review/fail
  aggregation are UNCHANGED. When a reference exists, append the deterministic line
  `"Reference applied (v<n>, hash <short>)."` to `overallFeedback`.
- Determinism preserved: same `(submissionContentHash, questionCount, referenceHash?)`
  → same prompts; same `(answers, conceptCheckSetId, referenceHash?)` → same evaluation.

### D-015 — Ledger signing for development
**Triggered by:** software-architect-agent, /build-feature project-foundation
**Resolved:** 2026-05-10
**Decision:** Ed25519 via Node `crypto` for development. Production KMS / signing
infrastructure remains deferred.

---

### D-006 — Visual direction
**Triggered by:** ux-ui-designer-agent, Phase 1
**Resolved:** 2026-05-10
**Decision:** Clean higher-ed SaaS dashboard style. Trustworthy, minimal, professional,
evidence-oriented, and department-chair friendly.
**Avoid:** Playful K-12 styling, overly futuristic AI styling, consumer chatbot styling.
**Reason:** The buyer is a department chair / program director in professional graduate
and online-heavy programs. Visual tone must reinforce defensibility and accreditation
posture, not gamified or chat-first engagement.
**Binding on:** ux-ui-designer-agent (design-system.md, ui-spec.md, screen-map.md must
all reflect this direction). Demo flow tone must match (calm authority, evidence-first).

---

### Q4 — Live oral assessment delivery method
**Resolved:** 2026-05-10
**Decision:** Not core v1. The MVP uses text-first verification. Architecture must leave
room for browser-based WebRTC oral verification as a later expansion.

**Future preference:** Browser-based WebRTC if oral verification becomes necessary after
pilot validation.

**Rejected for v1:**
- Zoom/Teams integration (vendor lock-in, scheduling friction, opaque audio path)
- Native app (deployment friction, App Store review for student-facing tool)
- Required live oral assessment (accessibility risk, scheduling burden, demo fragility)

**Reason:** Q2 = professional graduate / online-heavy makes oral strategically relevant,
but adding live oral in v1 introduces engineering complexity (WebRTC, audio storage),
accessibility/privacy risk (FERPA audio PII, recording consent across jurisdictions),
and demo fragility (browser permissions, mic failures, transcription accuracy). The
first MVP must prove the core thesis — submission-grounded concept checks, configurable
verification modes, and provenance-backed ledger — without compounding risk.

**Architectural implication:** Backend ledger schema and API contracts must allow a
verification interaction to carry an arbitrary modality field (text/audio/video). Adding
audio later must not require schema migration of existing ledger entries.

**Implication for /select-mvp:** Option B is blocked from v1. Becomes a post-MVP expansion.

---

### Q3 — Third moat
**Resolved:** 2026-05-05
**Decision:** Combination of:
- A) Data flywheel — verification interactions generate labeled data (submission → check
  quality → student response quality → grade outcome) that improves check generation
  quality over time. Network effect: more institutions → better checks → stronger moat.
- C) Institutional ledger switching cost — the signed provenance record accumulates
  institution-specific policy history, grade-appeal precedents, and accreditation evidence.
  Switching vendors means losing the ledger history. This is a structural retention driver.

**Explicit exclusions (founder-recorded):**
- Accreditation relationships (candidate B) may become a later moat, but are NOT the first moat.

**Full moat stack (confirmed):**
1. Methodology moat — submission-grounded concept check methodology (first confirmed moat)
2. Ledger moat — cryptographically signed provenance record (second confirmed moat)
3. Combined: data flywheel + institutional switching cost (third moat, now confirmed)

---

---

## Hard constraint waivers

_None requested._

---

## Phase 1 summary (chief-of-staff merge)

Phase 1 is complete. All three Phase 1 agents delivered. Key findings:

**Verified gaps (confirmed by external sources):**
- No competitor has a signed provenance ledger as a product
- No competitor has multi-modal audio capture for oral verification
- Nectir's quiz feature (Feb 2026) does NOT constitute submission-grounded concept checks
- Canvas holds ~39–50% of higher ed LMS; IgniteAI has 30K+ educators (not 40% of institutions)
- Nectir: $12.5M raised, 116+ CCC campuses — verified

**Unverified claims upgraded to hypothesis:**
- All pre-approved competitor capability ratings from S-001 remain [INTERNAL ASSESSMENT]
  pending external verification (external verification partially complete for Nectir, Canvas,
  Khanmigo, Cognii, Packback; LearnWise, OneTutor partially verified)

**New findings with strategic implications:**
- EU AI Act Annex III classifies Acta's features as high-risk AI — compliance burden AND
  go-to-market lever
- Cognii is the closest competitor to Acta's core thesis — not in the pre-approved set
- "Legally admissible" ledger positioning requires legal review before use
- FERPA DPA is required before any student submission enters any AI pipeline

**Docs/research-backed-mvp-options.md contains three MVP options (A, B, C).** The
product-manager-agent recommends Option A (verification-first, text-only, fastest path).
Founder must answer Q1, Q2, Q3 before /select-mvp can run.


## Phase 2 entry criteria — frontend retheme (added by Phase 1 sign-off)

The Phase 1 brutalist→scholarly-vellum retheme created a transitional CSS state
that Phase 2 must clean up as each surface track touches each file. This is
recorded so the debt does not become permanent.

### Legacy-token alias retire (mandatory entry criterion)

`src/frontend/app/surfaces.css` currently begins with a `:root` block that
aliases five legacy custom property names to the canonical Phase 0 tokens:

  --bg      → var(--bg-base)
  --surface → var(--bg-elevated)
  --text    → var(--text-primary)
  --muted   → var(--text-muted)
  --accent  → var(--signal)

These aliases exist so that every pre-Phase-1 surface rule (which references
the legacy names) continued to resolve correctly after the file split. They
are dead weight — two names for one token.

**Track B (instructor surfaces) and Track C (marketing / evidence / shared)
each must, when touching their owned surface rules, replace every legacy alias
reference inline with the canonical token name.** No track may ship while
adding new uses of the legacy aliases.

**By end of Phase 2 the alias `:root` block at the top of surfaces.css RETIRES
entirely.** Track C is the natural place for the final deletion + verification
sweep because it is the last surface track to land.

### Surface duplication of atoms (defer)

surfaces.css still contains a number of legacy class rules that now duplicate
atoms.css (`.placeholder-card`, `.placeholder-tag`, `.btn`, `.btn--primary`,
`.field`, etc.). The atoms.css versions ship later in the cascade and win on
equal specificity, so the surface duplicates are silently overridden but
otherwise harmless. Each track deletes the surface-level duplicate when it
touches the consuming surface. The principle: if atoms.css owns it,
surfaces.css cannot duplicate it.

### FI-2 — BrainAssistant SVG hardcoded gradient stops (defer to Phase 4)

The BrainAssistant SVG retains hardcoded violet/cyan radial-gradient stops
inside its halo definitions. On the warm-vellum background this reads as a
faint cyan/violet glow inside the orb perimeter, surrounded by a soft signal
(forest-green) drop-shadow halo applied at the surface layer.

**Status: kept for Phase 4 evaluation in full-app context. The original
"untouchable" constraint was the state machine, not the gradient stops.**
Phase 4 QA evaluates the orb in three contexts before the call:
  1. Idle on `/student/[id]/ta-lab` (the canonical demo surface)
  2. Inside the HelpChat header on `/student/[id]` (smaller orb, denser chrome)
  3. Inside the VerificationForm voice slot on `/submissions/[id]` (voice-state)
If the violet/cyan reads as off-palette in any of the three, swap the SVG
`stopColor` values to reference `var(--signal-glow)` / `var(--signal)` (a
one-line component change once approved). If the orb reads as
character-preserving across all three, leave it.

### FI-1 — TA Lab topbar chip overlap (resolved Phase 1)

Resolution shipped: the topbar uses an always-2-row grid layout at all
widths >=1024px. Row 1 holds brand + assignment + controls; row 2 holds the
help-type pill cluster. Investigated 1024/1280/1440 — the warn chip's
"final answers restricted" policy text (24 chars) cannot share a single row
with the 5-pill help-types cluster and the 4-button controls cluster below
~1600px without either truncating the warn text or overlapping a pill.
Truncation silently destroys the policy meaning. The 2-row layout preserves
every label.

Phase 2 reproduction recipe (regression check):
  GET `/student/{id}/ta-lab?demo=1` at viewport widths 1024, 1280, 1440.
  Inspect `.ta-lab__topbar` height (~82px) and verify that
  `.ta-lab__assignment` chips and `.ta-lab__help-types` pills sit on
  different Y rows (different `getBoundingClientRect().top`).

### Forward note — type size lever for AA-floor readability

`--text-muted` at 5.16:1 contrast against `--bg-base` clears WCAG AA but sits
close to the floor. If Phase 4 QA surfaces legibility complaints on page
ledes or helper text, the first lever is bumping muted text from `--type-xs`
(11px) to `--type-sm` (12px). Do not touch the color. Same lever holds for
eyebrows. (Recorded so the Phase 4 reviewer reaches for size, not contrast.)

### Acta TA Lab sphere (ActaSphere): spec signed 2026-05-17. Implementation scheduled after Phase 4 QA. See ~/Downloads/acta-ta-lab-sphere-spec.md for full spec.

### Eyebrow "//" prefix dropped Track A pre-signoff (2026-05-17)

**Rationale:** Non-technical buyers (instructors, students) parse `//` as code
syntax, not as a label separator. Uppercase tracked mono treatment alone
provides sufficient scaffolding. Other brutalist chrome (bracketed CTAs,
stepper numbers, corner ticks) remains — they don't trigger the same
reads-as-code pattern match.

**Scope of change:**
- Every `// LABEL` eyebrow text in the three Track A page.tsx files
  (`/student`, `/student/[id]`, `/submissions/[id]`) reduced to plain `LABEL`.
- The `.eyebrow` CSS class and its styling unchanged: uppercase, mono,
  0.18em tracking, `--signal` for default + `--text-muted` for `--muted`
  variant. Only the in-markup prefix changes; design-system role unchanged.
- `docs/track-a-screen-specs.md` body updated (44 occurrences) plus a new
  revision note in the spec header.
- Two `surfaces.css` documentation-comment references updated for consistency.

**What did NOT change:**
- Eyebrow atom signature / styling.
- Bracketed CTAs (`[ OPEN TA LAB → ]`).
- Bracketed stepper numbers (`[01]`–`[04]`).
- Card corner ticks.
- Any other brutalist chrome.

**Decision cost:** None — change is purely cosmetic and reversible if
buyer testing shows the `//` prefix actually was valuable for any user
segment. No atom contract changed.

### Track A signed off (2026-05-18)

All three Track A routes shipped per the signed Deliverable 3 spec
([`docs/track-a-screen-specs.md`](track-a-screen-specs.md)):

- **`/student`** — assignment list with eyebrow + role-stripe cards, three
  states (loaded, empty, loading), mobile CTA stacking at <768px.
- **`/student/[id]`** — 4-step vertical stepper (Read / Ask / Submit /
  Review), per-card eyebrows, HelpChat + SubmissionForm + SubmissionList
  embedded inside role-striped step bodies, mobile inline-number collapse.
- **`/submissions/[id]`** — submission view with role toggle (STUDENT VIEW /
  INSTRUCTOR VIEW), role-aware stripe + eyebrow copy, H1 reading the chained
  assignment title, ConceptCheckDisplay + ProvenanceDisclosure inside
  role-striped cards.

Shipped with:

- Cream-vellum design system fully cascaded across all student surfaces
- Consistent eyebrow rhythm (no `//` prefix; uppercase tracked mono only)
- Role stripe arbitration: cyan `.role-student`, forest-green `.role-instructor`
- H1 stability pattern: heading element present in DOM at all times,
  skeleton nested during loading
- Mobile responsive at 375px on all three routes
- 9 review URLs all return HTTP 200

Polish items closed out or parked in [`docs/future-phases.md`](future-phases.md):

- **Entry 2** — Track A horizontal cleanup pass (card-as-button refactor,
  TA Lab CTA, PolicyBanner, HelpChat mic/send button rebase)
- **Entry 3** — Concept-check flow flat-layout refactor (with Q1–Q3 open
  decisions for founder spec'ing before implementation)

Checkpoints for the audit trail:

- [`docs/checkpoints/route-1-student.md`](checkpoints/route-1-student.md)
- [`docs/checkpoints/route-2-student-detail.md`](checkpoints/route-2-student-detail.md)
- [`docs/checkpoints/route-3-submission.md`](checkpoints/route-3-submission.md)

Track A is closed for Phase 4 QA hand-off. Track B (instructor surfaces)
begins with Deliverable 4 screen-spec authoring; implementation gated on
sign-off, same discipline as Track A.

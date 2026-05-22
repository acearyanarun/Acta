# Sprint Backlog

**Purpose:** Current task assignments per agent. Updated by the chief-of-staff-orchestrator
at the start of each phase and as tasks are assigned or completed.
**Owner:** chief-of-staff-orchestrator
**Last updated:** 2026-05-10
**Status:** Phase 3 ACTIVE — Option A approved 2026-05-10; ledger design is the first deliverable

---

## Current phase: Phase 2 — MVP selection (active)

| Agent | Task | Status | Blocker |
|-------|------|--------|---------|
| chief-of-staff-orchestrator | Initialize Q1–Q6 in decisions.md | Done | — |
| chief-of-staff-orchestrator | Record Q1/Q2/Q3 founder decisions | Done | — |
| chief-of-staff-orchestrator | Unblock Phase 1 → Phase 2 gate | Done | — |
| All agents | Read docs/agent-brief.md before first task | Done (Phase 1) | — |

---

## Phase 1 backlog (complete — /research-mvp delivered 2026-05-05)

| Agent | Task | Status | Blocker |
|-------|------|--------|---------|
| market-research-agent | docs/market-research.md | Done | — |
| market-research-agent | docs/competitor-map.md | Done | — |
| market-research-agent | docs/source-log.md | Done | — |
| market-research-agent | docs/research-claims.md | Done | — |
| customer-discovery-agent | docs/customer-discovery.md | Done | — |
| customer-discovery-agent | docs/icp.md | Done (Q1/Q2 resolved) | — |
| customer-discovery-agent | docs/interview-questions.md | Done | — |
| customer-discovery-agent | docs/objections.md | Done | — |
| qa-security-devops-agent | FERPA scoping in docs/security-review.md | Done | — |
| qa-security-devops-agent | State AI-in-ed law scoping (CA, NY, TX) | Partial — [HYPOTHESIS] | Primary source review pending |

---

## Phase 2 backlog (ACTIVE — /select-mvp unblocked 2026-05-05)

| Agent | Task | Status | Blocker |
|-------|------|--------|---------|
| product-manager-agent | docs/research-backed-mvp-options.md | Done (Phase 1 merge) | — |
| product-manager-agent | Run /select-mvp — score Option A/B/C | Done (2026-05-10) | — |
| product-manager-agent | docs/mvp-scope.md (Option A) | Done | Founder final sign-off pending |
| product-manager-agent | docs/not-building.md (post-MVP list) | Done | — |
| chief-of-staff-orchestrator | docs/final-mvp-plan.md | Done | Founder sign-off pending |
| product-manager-agent | docs/product-requirements.md | Not started | Founder Option A sign-off |
| product-manager-agent | docs/user-stories.md | Not started | Founder Option A sign-off |
| ux-ui-designer-agent | Update docs/demo-flow.md (drop oral scene; anchor in prof grad persona) | Ready | D-006 visual direction |
| customer-discovery-agent | Refresh docs/icp.md with prof grad interview targets | Ready | — |

**Q4 note:** Resolved 2026-05-10. Oral verification deferred. No longer a Phase 2 blocker.
Architecture must reserve modality field on ledger entries for future audio extension.

**D-006 note:** Demo audience = dept chair / program director (resolved 2026-05-05).
Visual direction still open — ux-ui-designer-agent cannot finalize demo tone without this.

---

## Phase 3 backlog (ACTIVE — activated by Option A approval 2026-05-10)

**Sequencing rule (per .claude/policies/parallel-workflow.md):** software-architect-agent
and ai-llm-engineer-agent lock the ledger design FIRST. Frontend/backend/AI parallel tracks
do not begin until ledger design is approved by founder.

**Hard data gate:** No real student data may enter any pipeline until D-003 (model provider
FERPA DPA) is resolved. Synthetic data only until then.

| Agent | Task | Status | Blocker |
|-------|------|--------|---------|
| software-architect-agent | docs/architecture.md — ledger design (2–3 approaches, recommendation) | Ready | — |
| software-architect-agent | docs/database-schema.md — ledger schema with reserved modality field | Ready | Architecture approval |
| software-architect-agent | docs/api-contracts.md | Not started | Architecture approval |
| software-architect-agent | docs/file-structure.md | Not started | Architecture approval |
| ai-llm-engineer-agent | Coordinate with architect on ledger event format for AI pipeline | Ready | — |
| ai-llm-engineer-agent | docs/model-routing.md (track $7 soft target; Claude as dev provider) | Ready | — |
| ai-llm-engineer-agent | docs/prompt-injection-tests.md | Ready | — |
| ai-llm-engineer-agent | prompts/ + evals/ — synthetic data only | Ready | — |
| qa-security-devops-agent | Enforce no-real-student-data gate | Active | — |
| qa-security-devops-agent | docs/test-plan.md | Ready | — |
| frontend-developer-agent | All work | Inactive | mvp-scope ✓ + ui-spec + api-contracts + ledger design approved |
| backend-developer-agent | All work | Inactive | architecture + api-contracts + ledger design approved |
| ux-ui-designer-agent | docs/ui-spec.md (instructor assignment policy section) | Done 2026-05-10 | — |
| product-manager-agent | docs/product-requirements.md R4.1 + user-stories.md | Done 2026-05-10 | — |
| software-architect-agent | docs/database-schema.md + docs/api-contracts.md + docs/architecture.md (teacher-assignment-policy) | Done 2026-05-10 | — |
| backend-developer-agent | src/backend assignments routes + repos + schema | Done 2026-05-10 | — |
| frontend-developer-agent | src/frontend instructor UI | Done 2026-05-10 | — |
| qa-security-devops-agent | tests/assignment-policy.test.ts (16 tests, all pass) | Done 2026-05-10 | — |
| ai-llm-engineer-agent | prompt-builder + stub/Anthropic providers + selector | Done 2026-05-10 | — |
| backend-developer-agent | help route + student routes + auth extension | Done 2026-05-10 | — |
| frontend-developer-agent | student list + chat pages + 3 components + drift banner | Done 2026-05-10 | — |
| qa-security-devops-agent | tests/student-guided-help.test.ts (23 tests, all pass) | Done 2026-05-10 | — |
| software-architect-agent | submissions table + migration 0002 + repo interface | Done 2026-05-11 | — |
| backend-developer-agent | submissions routes (POST/GET list/GET single) + memory + Postgres repos | Done 2026-05-11 | — |
| frontend-developer-agent | submission form + list + viewer page + integrations on /student/[id] and /instructor/[id] | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/student-submission.test.ts (20 tests, all pass) | Done 2026-05-11 | — |
| software-architect-agent | concept_check_sets table + migration 0003 + repo interface + assignmentsRepo.getByTenantIdVersion | Done 2026-05-11 | — |
| ai-llm-engineer-agent | concept-check prompt builder + stub/Anthropic providers + selector | Done 2026-05-11 | — |
| backend-developer-agent | concept-check routes (POST + 2 GETs) + memory + Postgres repos | Done 2026-05-11 | — |
| frontend-developer-agent | concept-check-display component + /submissions/[id] section | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/concept-check-generation.test.ts (23 tests, all pass) | Done 2026-05-11 | — |
| software-architect-agent | concept_check_verifications table + migration 0004 + repo interface | Done 2026-05-11 | — |
| ai-llm-engineer-agent | verification prompt builder + stub/Anthropic evaluators + selector + conservative downgrade | Done 2026-05-11 | — |
| backend-developer-agent | verification routes (POST + 2 GETs) + cross-check validation + memory + Postgres repos | Done 2026-05-11 | — |
| frontend-developer-agent | verification-form + verification-result-display + concept-check-display refactor | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/concept-check-verification.test.ts (27 tests, all pass) | Done 2026-05-11 | — |
| software-architect-agent | assignment_reference_solutions table + migration 0005 + repo interface (no studentId / no update/delete) | Done 2026-05-11 | — |
| backend-developer-agent | reference-solution routes (3) + memory + Postgres repos + reference-hash helper | Done 2026-05-11 | — |
| frontend-developer-agent | reference-solution-section.tsx + instructor/[id] mount + CSS + API client | Done 2026-05-11 | — |
| ai-llm-engineer-agent | docs/ai-spec.md trusted/untrusted context boundary (docs only — no prompt change) | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/instructor-reference-rag.test.ts (24 tests, all pass) | Done 2026-05-11 | — |
| software-architect-agent | migration 0006 + nullable pin columns + repo signature extensions | Done 2026-05-11 | — |
| ai-llm-engineer-agent | reference-aware concept-check + verification prompt builders + stub provider awareness (D-044) | Done 2026-05-11 | — |
| backend-developer-agent | route-layer reference retrieval + provider wiring + persistence | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/reference-rag-retrieval.test.ts (24 tests, all pass) | Done 2026-05-11 | — |
| ux-ui-designer-agent | demo-flow polish — role badges, section reorders, helper copy, ledger rewrite, button labels (instructor-student-demo-flow-polish) | Done 2026-05-11 | — |
| frontend-developer-agent | implemented all polish edits across 10 pages + 6 components + globals.css; new top-nav.tsx with active-state | Done 2026-05-11 | — |
| qa-security-devops-agent | regression: 161/161 tests still pass; `pnpm lint`/`pnpm -r typecheck`/`pnpm --filter @acta/frontend build` clean; no backend/schema/API/AI changes confirmed | Done 2026-05-11 | — |
| software-architect-agent | dashboard aggregator + 3 tenant-wide repo read methods (D-045) + route + types (basic-teacher-review-dashboard) | Done 2026-05-11 | — |
| backend-developer-agent | `/v1/instructor/dashboard` route wiring + memory + Postgres repo impls of new read methods | Done 2026-05-11 | — |
| frontend-developer-agent | `/instructor/dashboard` page + summary cards + 3 tables + entry CTAs + globals.css | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/instructor-dashboard.test.ts (19 tests, all pass); D-046 privacy semantics regression | Done 2026-05-11 | — |
| product-manager-agent | R11 + user stories for evidence-export | Done 2026-05-11 | — |
| ux-ui-designer-agent | docs/ui-spec.md evidence-report layout + print styles + entry points | Done 2026-05-11 | — |
| backend-developer-agent | evidence-report builder (pure) + route + types + server wiring (evidence-export) | Done 2026-05-11 | — |
| frontend-developer-agent | /submissions/[id]/evidence-report printable page + entry CTAs + globals.css print rules + dashboard row links | Done 2026-05-11 | — |
| qa-security-devops-agent | tests/evidence-report.test.ts (24 tests, all pass); banned-language scan; student isolation regression | Done 2026-05-11 | — |
| ux-ui-designer-agent | docs/screen-map.md, docs/design-system.md | Ready | — |
| ux-ui-designer-agent | Update docs/demo-flow.md (drop oral; chair persona; "audit-ready" language) | Ready | — |
| product-manager-agent | docs/product-requirements.md, docs/user-stories.md | Ready | — |

---

## Build pre-conditions tracker

| Gate | Status |
|------|--------|
| MVP scope approved | ✓ 2026-05-10 |
| D-002 positioning language | ✓ 2026-05-10 |
| D-003 dev-time model provider | ✓ 2026-05-10 (Claude + synthetic data only) |
| D-005 cost target framing | ✓ 2026-05-10 |
| Q5 LMS depth (v1 = standalone) | ✓ 2026-05-10 |
| D-006 visual direction | ✓ 2026-05-10 |
| Ledger design approved | Pending — software-architect-agent first deliverable |
| Architecture (api-contracts, file-structure) approved | Pending |
| UI-spec approved | Pending — designer can begin (D-006 resolved) |
| **Signed DPA (Anthropic or alternative)** | **Pilot blocker only** — does NOT block synthetic-data MVP development |

---

## Phase 4 backlog (activated by /run-red-team and /review-demo)

_To be populated after build is complete._

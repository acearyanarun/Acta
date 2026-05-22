# /build-feature [feature-name]

Kicks off Phase 3: implementation of a specific approved feature.

---

## Pre-conditions (enforced before running)

This command must not run until:
- `docs/mvp-scope.md` is founder-approved in `docs/decisions.md`
- `docs/architecture.md` is marked approved by the software-architect-agent
- `docs/api-contracts.md` is marked approved
- `docs/ui-spec.md` is marked approved for the feature being built
- The signed ledger design is resolved in `docs/decisions.md` (C2)

If any pre-condition is unmet, the chief-of-staff-orchestrator must block and list missing items.

---

## What this command does

1. chief-of-staff-orchestrator confirms the feature is in approved `docs/mvp-scope.md`.
2. Assigns the feature to the correct agents based on file ownership rules.
3. Parallel implementation begins (after ledger design is locked):
   - frontend-developer-agent: UI from `docs/ui-spec.md`
   - backend-developer-agent: API from `docs/api-contracts.md`
   - ai-llm-engineer-agent: AI pipeline from `docs/ai-spec.md`
4. qa-security-devops-agent monitors for security issues as code is written.
5. Agents surface blockers in `docs/bug-list.md` rather than making assumptions.

---

## Build constraints

- No agent may implement a feature not listed in `docs/mvp-scope.md`.
- No agent may deviate from approved contracts (`docs/api-contracts.md`, `docs/ui-spec.md`)
  without a Level 3 decision.
- The signed ledger write path must be append-only and tamper-evident from the first line
  of code (C2).
- Student data must be handled as FERPA PII at every layer (C5).
- No detection classifiers or detection pipelines (C4).

---

## Sequencing within Phase 3

First (must complete before parallel tracks begin):
- software-architect-agent and ai-llm-engineer-agent finalize ledger design
- chief-of-staff-orchestrator records ledger design decision in `docs/decisions.md`

Then parallel:
- Track A: frontend-developer-agent
- Track B: backend-developer-agent
- Track C: ai-llm-engineer-agent (implementation)

---

## Completion

A feature is complete when:
- All agents have finished their owned files for the feature
- qa-security-devops-agent has reviewed and cleared the feature in `docs/test-plan.md`
- No open critical or high bugs in `docs/bug-list.md` for this feature
- chief-of-staff-orchestrator updates `docs/changelog.md`

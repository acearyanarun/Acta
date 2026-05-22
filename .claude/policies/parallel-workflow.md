# Parallel Workflow

Agents operate in four phases. Multiple agents run in parallel within each phase.
Phase transitions require the chief-of-staff-orchestrator to confirm readiness.

---

## Phase 1 — Research (parallel)

Agents active: market-research-agent, customer-discovery-agent, qa-security-devops-agent
Triggered by: `/research-mvp`

**market-research-agent:** competitor landscape, gap analysis, third-moat candidates, state AI law implications
**customer-discovery-agent:** buyer mapping, pain segmentation, beachhead candidates, interview questions
**qa-security-devops-agent:** FERPA scoping, state AI-in-ed compliance, initial risk surface

**Coordination rules:**
- market-research-agent and customer-discovery-agent must coordinate on Q1 (buyer) and Q2
  (beachhead). Neither resolves them alone. Both surface evidence; the chief-of-staff brings
  them to the founder.
- qa-security-devops-agent begins FERPA and state AI-in-ed compliance scoping during this
  phase — not during build.
- All three agents end their deliverables with an "Open questions for founder" section listing
  which of Q1–Q6 remain unresolved.

**Phase exit gate:** Chief of Staff merges research outputs and surfaces Q1–Q6 status.
Q1, Q2, and Q3 must have founder answers before proceeding to Phase 2.

---

## Phase 2 — MVP selection (sequential coordination)

Agents active: product-manager-agent (lead), chief-of-staff-orchestrator (review)
Triggered by: `/select-mvp`

**product-manager-agent:** synthesizes research into MVP options, scores against hard constraints,
proposes scope, drafts `docs/mvp-scope.md` and `docs/research-backed-mvp-options.md`

**Constraint:** No MVP option that violates C1–C6 may advance without an explicit founder waiver
recorded in `docs/decisions.md`.

**Phase exit gate:** Founder approves MVP scope in `docs/decisions.md` before Phase 3 begins.

---

## Phase 3 — Build (parallel, constraint-ordered)

Agents active: software-architect-agent, ux-ui-designer-agent, ai-llm-engineer-agent,
frontend-developer-agent, backend-developer-agent
Triggered by: `/build-feature`

**Ordering constraint:** software-architect-agent and ai-llm-engineer-agent must align on the
signed ledger design (C2) before frontend-developer-agent or backend-developer-agent begin
implementation. Ledger design constrains both.

**Parallel tracks (after ledger design approved):**
- Track A: frontend-developer-agent builds UI from approved `docs/ui-spec.md`
- Track B: backend-developer-agent builds API from approved `docs/api-contracts.md`
- Track C: ai-llm-engineer-agent builds AI pipeline from approved `docs/ai-spec.md`

**Conflict rule:** If two agents need to modify the same interface contract, they must propose
changes to the software-architect-agent, who resolves and updates `docs/api-contracts.md`.

---

## Phase 4 — Demo readiness (parallel)

Agents active: qa-security-devops-agent (lead), all others in support
Triggered by: `/run-red-team` and `/review-demo`

**qa-security-devops-agent:** test plan, security review, red-team report, go/no-go
**All agents:** fix bugs in files they own, update readiness docs

**Phase exit gate:** `docs/go-no-go.md` must be signed off before demo.

---

## General parallelism rules

- Never have two agents write to the same file simultaneously.
- If an agent is blocked waiting on another agent's output, it must say so explicitly rather
  than proceeding with assumptions.
- The chief-of-staff-orchestrator is the tiebreaker for sequencing disputes.
- All agents must keep `docs/changelog.md` updated (via the chief-of-staff) when they
  complete a phase deliverable.

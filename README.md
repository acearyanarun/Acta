# Acta

Acta is the proof layer for AI-era learning. After every submission, the system runs short
concept checks generated from the student's own work — async by default, live oral for
high-stakes assessments — and captures every interaction in a cryptographically signed ledger
that defends grades on appeal and supports accreditation review.

**The wedge is verification. Not tutoring.**

---

## Run instructions (foundation scaffolding)

The foundation is scaffolding only — no product features are implemented. These
instructions verify the dev environment boots cleanly.

### Prerequisites

- Node.js 20.10.0 (see `.nvmrc`)
- pnpm 9
- Docker (for the local Postgres only — LOCAL DEV ONLY)

### One-time setup

```bash
nvm use            # picks up Node from .nvmrc
pnpm install
cp .env.example .env   # do NOT change ALLOW_REAL_STUDENT_DATA from false
```

### Daily commands

```bash
pnpm db:up                 # start local Postgres (LOCAL DEV ONLY)
pnpm dev:backend           # Fastify on :4000 (synthetic-data guard runs at boot)
pnpm dev:frontend          # Next.js on :3000
pnpm lint                  # Biome
pnpm -r typecheck          # TypeScript across workspaces
pnpm test:foundation       # Vitest foundation suite
pnpm check:foundation      # structural + hygiene checks (scripts/check-foundation.sh)
```

### Health checks

- Frontend: <http://localhost:3000/healthz>
- Backend: <http://localhost:4000/healthz>

### Foundation guarantees

- No product logic — placeholder routes return 501
- No real student data — `ALLOW_REAL_STUDENT_DATA=false` is enforced at backend boot (D-003)
- No "legally admissible" language anywhere in `src/` (D-002)
- No real ledger writes, no real AI calls, no LMS adapters, no WebRTC
- All L3 tech stack picks recorded in [docs/decisions.md](docs/decisions.md) (D-007 through D-015)

---

## Claude Code Multi-Agent Operating System

This repository uses a Claude Code multi-agent system to take Acta from research through
MVP build and demo readiness. Ten specialized agents work in parallel, each with specific
responsibilities, file ownership, and hard constraints they cannot override.

### Why a multi-agent system?

- Parallel research, design, and build across specialized domains
- Hard constraints (C1–C6) enforced by policy, not memory
- Open questions (Q1–Q6) surfaced at every step instead of silently resolved
- File ownership rules prevent agents from overwriting each other's work
- Phase gates ensure the founder makes decisions before the system proceeds

---

### The 10 agents

| Agent | Role |
|-------|------|
| `chief-of-staff-orchestrator` | Coordinates all agents, enforces constraints, gates phase transitions, tracks decisions |
| `market-research-agent` | Competitor landscape, gap analysis, regulatory environment, third-moat candidates |
| `customer-discovery-agent` | Buyer mapping, pain segmentation, beachhead candidates, interview frameworks |
| `product-manager-agent` | MVP scope, product requirements, user stories, not-building list |
| `ux-ui-designer-agent` | UI spec, screen map, design system, demo flow |
| `software-architect-agent` | Architecture, API contracts, database schema, file structure |
| `frontend-developer-agent` | Frontend implementation (activates in Phase 3) |
| `backend-developer-agent` | Backend API and signed ledger (activates in Phase 3) |
| `ai-llm-engineer-agent` | AI pipeline design, prompts, model routing, evals |
| `qa-security-devops-agent` | Test plan, security review, red-team, deployment, go/no-go |

Each agent file lives in `.claude/agents/`. Each file references shared policies rather than
duplicating rules.

---

### Shared policy files

| File | What it governs |
|------|----------------|
| `.claude/policies/global-agent-policy.md` | Behavioral rules, naming conventions, constraint enforcement for all agents |
| `.claude/policies/decision-gates.md` | Level 1/2/3 decision framework and DECISION REQUIRED format |
| `.claude/policies/file-ownership.md` | Which agent owns which files; conflict resolution rules |
| `.claude/policies/parallel-workflow.md` | Phase sequencing, parallel tracks, coordination rules |
| `.claude/policies/research-quality.md` | Source labeling, citation rules, prohibited fabrications |

---

### File ownership rules

Every file in `docs/` and `src/` is owned by exactly one agent. Agents may read files
listed as read-only. No agent may overwrite another agent's file.

If two agents need to change the same file, they propose the change; the owning agent decides.
If ownership is unclear, the `chief-of-staff-orchestrator` resolves it.

Full ownership map: `.claude/policies/file-ownership.md`

---

### Slash commands

| Command | What it does |
|---------|-------------|
| `/research-mvp` | Phase 1: parallel market research, customer discovery, FERPA scoping |
| `/select-mvp` | Phase 2: MVP options synthesis and founder approval gate |
| `/build-feature [name]` | Phase 3: implement a specific approved feature |
| `/run-red-team` | Phase 4: adversarial security and ledger tamper testing |
| `/review-demo` | Phase 4: demo readiness review and go/no-go |

---

### Recommended workflow

```
1. /research-mvp
   → Runs market-research-agent, customer-discovery-agent, qa-security-devops-agent in parallel
   → Produces competitor map, buyer landscape, FERPA scoping
   → Surfaces Q1–Q6 for founder review
   → BLOCKED from proceeding until Q1, Q2, Q3 have founder answers

2. /select-mvp
   → Activates product-manager-agent
   → Produces 2–3 MVP options scored against C1–C6
   → BLOCKED until founder picks an option and records it in docs/decisions.md

3. /build-feature [feature-name]
   → Activates software-architect-agent + ux-ui-designer-agent first (design phase)
   → Then parallel: frontend, backend, AI pipeline
   → BLOCKED until ledger design is locked (C2)

4. /run-red-team
   → qa-security-devops-agent executes: ledger tamper, evidence chain, prompt injection,
     FERPA exposure paths, grade-appeal stress test
   → Any Critical finding blocks go/no-go

5. /review-demo
   → Final readiness check
   → "Ledger defends a contested grade" scenario must be walkable
   → Produces docs/go-no-go.md sign-off
```

---

### Decision gate behavior

| Level | What it means | Agent behavior |
|-------|--------------|---------------|
| **Level 1** | Creating folders, starter docs, templates, README | Proceed freely |
| **Level 2** | Implementing within approved docs, no scope changes | Proceed |
| **Level 3** | Anything that changes direction, scope, architecture, security, or ICP | **Stop and ask the founder** |

When a Level 3 gate is triggered, the agent outputs a `DECISION REQUIRED:` block with the
question, options, and a recommendation — but does not proceed until the founder answers.

All decisions are recorded in `docs/decisions.md`.

---

### Hard constraints (C1–C6)

Full text in `docs/agent-brief.md`. Summary:

| ID | Constraint |
|----|-----------|
| **C1** | The wedge is verification. Do not lead with tutoring. |
| **C2** | The signed ledger is a v1 requirement — not v2. |
| **C3** | All three grading modes must be in the MVP (or explicit founder waiver). |
| **C4** | No AI cheating-detection features — ever. This is the paradigm Acta replaces. |
| **C5** | Student data is FERPA-regulated PII. Treat it at every layer. |
| **C6** | Any feature adding instructor burden is a Level 3 decision. |

Any agent output that violates C1–C6 without a founder-approved waiver in `docs/decisions.md`
must be rejected and re-done.

---

### Open questions the founder still needs to answer

These are **Q1–Q6** — Level 3 decisions that block phase transitions. They are initialized
as "Open" in `docs/decisions.md`.

| ID | Question |
|----|---------|
| **Q1** | Who is the primary buyer? (faculty / dept. chair / provost / LMS partner / accreditor) |
| **Q2** | What is the beachhead segment? (R1 / community college / online-only / professional grad / K-12) |
| **Q3** | What is the third moat? (data flywheel / accreditation relationships / switching cost / other) |
| **Q4** | How is live oral assessment delivered? (WebRTC / Zoom-Teams / native) |
| **Q5** | How deep is the LMS integration for v1? (LTI 1.3 / deep Canvas / standalone) |
| **Q6** | Are the first pilots institutional or instructor-purchased? |

**Q1, Q2, and Q3 must be answered before `/select-mvp` can run.**
Q4, Q5, and Q6 must be answered before the relevant architectural decisions are locked.

---

### How to prevent agents from overwriting each other

1. Every agent file lists its owned files and read-only files explicitly.
2. `.claude/policies/file-ownership.md` is the authoritative ownership map.
3. Agents that need to modify another agent's file must propose the change — not make it.
4. The `chief-of-staff-orchestrator` resolves disputes.
5. If in doubt about a file: check `.claude/policies/file-ownership.md` before writing.

---

### Key docs

| Doc | Purpose |
|-----|---------|
| `docs/agent-brief.md` | Source of truth — company context, C1–C6, Q1–Q6, naming rules |
| `docs/decisions.md` | All open questions and Level 3 decisions — the phase gate tracker |
| `docs/sprint-backlog.md` | Current task assignments per agent |
| `docs/changelog.md` | Completed deliverables log |
| `docs/mvp-scope.md` | Approved MVP scope (populated after /select-mvp) |
| `docs/not-building.md` | Explicit deferral list — scope discipline |

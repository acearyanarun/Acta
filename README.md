# Acta

**A verification layer for AI-era learning.**

Universities are losing the AI-detection arms race. Acta replaces detection with evidence: after every submission, students answer short concept checks generated from their own work, and every interaction is captured in a cryptographically signed ledger that defends grades on appeal and supports accreditation review.

The wedge is verification — not tutoring, not detection.

---

## Screenshots

**Home — instructor-facing pitch**
![Home](docs/screenshots/01-home.png)

**Instructor dashboard** — review queue with live submission outcomes, "needs attention" surface, evidence-report links
![Instructor dashboard](docs/screenshots/03-instructor-dashboard.png)

**Student workspace** — per-assignment policy badges (confidence score / final answer restricted) with policy hash IDs
![Student workspace](docs/screenshots/04-student.png)

**Ledger / roadmap** — provenance hashes (`policyHash`, `contentHash`, `referenceHash`) pinned to every row today
![Ledger roadmap](docs/screenshots/02-ledger.png)

**Student-data handling** — FERPA-aware data model explained in plain English for pilot conversations
![How Acta handles student data](docs/screenshots/05-about-data.png)

---

## What this demonstrates

- **Three grading modes** in the data model — confidence score, required gate, final-answer-restricted
- **Hash-pinned provenance** on every policy version, submission, and reference solution
- **Per-tenant scope** with cross-tenant read failures asserted by defense-in-depth tests
- **FERPA-first architecture** — synthetic-data-only guard enforced at backend boot (`ALLOW_REAL_STUDENT_DATA=false` refuses real data without a signed DPA reference)
- **Two LLM provider paths** — deterministic stub (default, tests/demos) and OpenAI gated behind `USE_REAL_LLM=true` + `OPENAI_API_KEY`, with zero-data-retention settings
- **Async concept checks** with planned live-oral path for high-stakes work

## Stack

- **Language:** TypeScript (strict)
- **Runtime:** Node.js 20
- **Backend:** Fastify on `:4000`
- **Frontend:** Next.js on `:3000`
- **Database:** Postgres (local via Docker)
- **Package manager:** pnpm workspaces
- **Tooling:** Biome, Vitest

## Run locally

```bash
nvm use                              # picks up Node from .nvmrc
pnpm install
cp .env.example .env                 # keep ALLOW_REAL_STUDENT_DATA=false
pnpm db:up                           # local Postgres via Docker
pnpm dev:backend                     # Fastify on :4000
pnpm dev:frontend                    # Next.js on :3000
```

Open <http://localhost:3000> for the demo flow (instructor + student workspaces seeded with synthetic data).

Health checks: <http://localhost:3000/healthz>, <http://localhost:4000/healthz>

## Design constraints

A handful of hard rules shape every decision in this codebase:

1. Verification is the wedge — not tutoring
2. The signed ledger ships in v1
3. All three grading modes ship in MVP
4. No AI-detection features, ever — that's the paradigm Acta replaces
5. Student data is FERPA PII at every layer
6. Any feature that adds instructor burden requires explicit approval

## Repo layout

```
src/
  backend/    # Fastify API, ledger, AI provider selection, FERPA guards
  frontend/   # Next.js — home, instructor dashboard, student workspace, ledger viewer
  ai/         # provider abstraction + stub/anthropic implementations
docs/         # architecture, decisions, FERPA scoping, design specs, screenshots
prompts/      # AI pipeline prompt sources
evals/        # eval harness
scripts/      # foundation checks
tests/        # foundation + defense-in-depth suite
.claude/      # multi-agent operating system (10 role-scoped agents, policy files, slash commands)
```

The `.claude/` directory is a custom multi-agent system that drives this build — research, scope, design, implementation, security, and demo phases each run as their own specialized agent with hard constraints they cannot override.

---

Built by [Aryan Arun](https://github.com/aryanarun).

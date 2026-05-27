# Acta

Acta is the proof layer for AI-era learning. After every submission, the system runs short
concept checks generated from the student's own work — async by default, live oral for
high-stakes assessments and captures every interaction in a cryptographically signed ledger
that defends grades on appeal and supports accreditation review.

Universities are losing the AI-detection arms race. Acta replaces detection with evidence: after every submission, students answer short concept checks generated from their own work, and every interaction is captured in a cryptographically signed ledger that defends grades on appeal and supports accreditation review.

The wedge is verification — not tutoring, not detection.

---

## What this demonstrates

- **Cryptographically signed audit ledger** — append-only, hash-chained, designed to hold up under contested-grade scenarios
- **Three grading modes** — confidence score, required gate, fail-only escalation
- **Async + live oral assessment** — short concept checks by default, live oral for high-stakes work
- **FERPA-aware data model** — student data treated as regulated PII at every layer (synthetic-data-only guard enforced at backend boot)

## Status

Foundation scaffolding. Dev environment and policy guards are in place; product features are intentionally not implemented yet — placeholder routes return `501`. This repo is the public companion to the working build.

## Stack

- **Language:** TypeScript (strict)
- **Runtime:** Node.js 20
- **Backend:** Fastify
- **Frontend:** Next.js
- **Database:** Postgres (local via Docker)
- **Package manager:** pnpm workspaces
- **Tooling:** Biome, Vitest

## Run locally

```bash
nvm use
pnpm install
cp .env.example .env
pnpm db:up
pnpm dev:backend     # :4000
pnpm dev:frontend    # :3000
```

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
src/        # backend + frontend workspaces (scaffolding only)
docs/       # architecture decisions and scope
prompts/    # AI pipeline prompt sources
evals/      # eval harness
scripts/    # foundation checks
tests/      # foundation suite
```

---

Built by [Aryan Arun](https://github.com/aryanarun). The working build (full MVP, agent system, decision logs) lives in a private repo.

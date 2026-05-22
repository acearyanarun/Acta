# File Structure

**Purpose:** Annotated repository tree. Foundation scaffolding only — product code TBD.
**Owner:** software-architect-agent
**Last updated:** 2026-05-10
**Status:** Foundation scaffolding approved 2026-05-10 (D-007 through D-015)

---

## Repository tree (foundation only)

```
acta.io/
├── .claude/                         # agent OS (existing)
├── .github/
│   └── workflows/
│       └── ci.yml                   # lint + typecheck + smoke (D-014)
├── .editorconfig
├── .env.example                     # placeholder env vars (qa-security)
├── .gitignore
├── .nvmrc
├── biome.json                       # lint + format (D-012)
├── docker-compose.yml               # LOCAL DEV ONLY — Postgres for foundation (D-010)
├── package.json                     # pnpm workspace root
├── pnpm-workspace.yaml
├── README.md
├── tsconfig.base.json
├── docs/                            # owned per .claude/policies/file-ownership.md
├── scripts/
│   └── check-foundation.sh          # one-shot local verification
├── tests/
│   └── foundation.test.ts           # smoke: FE + BE healthz
└── src/
    ├── frontend/                    # frontend-developer-agent (D-007: Next.js 14)
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx             # landing placeholder
    │   │   ├── globals.css
    │   │   ├── instructor/page.tsx  # placeholder
    │   │   ├── student/page.tsx     # placeholder
    │   │   ├── ledger/page.tsx      # placeholder
    │   │   └── healthz/route.ts     # GET /healthz
    │   ├── lib/
    │   │   └── api-client.ts        # typed backend stub
    │   ├── next.config.js
    │   ├── package.json
    │   └── tsconfig.json
    │
    ├── backend/                     # backend-developer-agent (D-008: Fastify)
    │   ├── src/
    │   │   ├── server.ts            # Fastify boot
    │   │   ├── lib/
    │   │   │   ├── env.ts           # env validation (fail-fast)
    │   │   │   └── synthetic-data-guard.ts  # blocks boot if real-data flag set without DPA
    │   │   └── routes/
    │   │       ├── healthz.ts       # GET /healthz
    │   │       ├── assignments.ts   # placeholder (501)
    │   │       ├── submissions.ts   # placeholder (501)
    │   │       ├── checks.ts        # placeholder (501)
    │   │       └── ledger.ts        # placeholder (501)
    │   ├── package.json
    │   └── tsconfig.json
    │
    └── ai/                          # ai-llm-engineer-agent
        ├── README.md                # synthetic fixtures only — D-003
        ├── prompts/.gitkeep
        ├── evals/.gitkeep
        └── package.json
```

---

## Foundation rules

- **No product logic in any of these files.** Routes return 501 / placeholder pages.
- **Synthetic data only.** `synthetic-data-guard.ts` refuses to boot if `ALLOW_REAL_STUDENT_DATA=true` and no `FERPA_DPA_REFERENCE` is set (D-003).
- **Standalone-first.** No LMS adapters, no LTI handler, no WebRTC media pipe.
- **Ledger is reserved-only at this stage.** `src/backend/src/routes/ledger.ts` returns a placeholder; real signing path is built in a later /build-feature run.

---

## File ownership

See [.claude/policies/file-ownership.md](../.claude/policies/file-ownership.md) for the full map.

- `src/frontend/` — frontend-developer-agent
- `src/backend/` — backend-developer-agent
- `src/ai/` — ai-llm-engineer-agent
- `tests/`, `scripts/check-foundation.sh`, `.github/workflows/ci.yml`, `biome.json`, `docker-compose.yml`, `.env.example` — qa-security-devops-agent
- Root `package.json`, `tsconfig.base.json`, `pnpm-workspace.yaml`, `.editorconfig`, `.nvmrc`, `.gitignore` — software-architect-agent (workspace config)

---

## Open items at foundation stage

- Production deployment topology (deferred)
- Auth implementation (placeholder 401s only)
- Real ledger write path (deferred to a later /build-feature run)
- AI pipeline implementation (synthetic-only scaffolding now)

# File Ownership

Each file in `docs/` is owned by exactly one agent. Agents may read files marked read-only.
No agent may overwrite a file owned by another agent. Propose the change instead.

---

## Ownership map

### chief-of-staff-orchestrator
**Owns:** `docs/decisions.md`, `docs/changelog.md`, `docs/sprint-backlog.md`,
`docs/final-mvp-plan.md`, `docs/go-no-go.md`
**Read-only:** all other docs/

### market-research-agent
**Owns:** `docs/market-research.md`, `docs/competitor-map.md`, `docs/source-log.md`,
`docs/research-claims.md`
**Read-only:** `docs/agent-brief.md`, `docs/decisions.md`

### customer-discovery-agent
**Owns:** `docs/customer-discovery.md`, `docs/icp.md`, `docs/interview-questions.md`,
`docs/objections.md`
**Read-only:** `docs/agent-brief.md`, `docs/market-research.md`, `docs/competitor-map.md`,
`docs/decisions.md`

### product-manager-agent
**Owns:** `docs/product-requirements.md`, `docs/mvp-scope.md`, `docs/user-stories.md`,
`docs/not-building.md`, `docs/research-backed-mvp-options.md`, `docs/risk-review.md`
**Read-only:** `docs/agent-brief.md`, `docs/market-research.md`, `docs/customer-discovery.md`,
`docs/icp.md`, `docs/objections.md`, `docs/decisions.md`

### ux-ui-designer-agent
**Owns:** `docs/ui-spec.md`, `docs/demo-flow.md`, `docs/design-system.md`, `docs/screen-map.md`
**Read-only:** `docs/agent-brief.md`, `docs/product-requirements.md`, `docs/mvp-scope.md`,
`docs/user-stories.md`, `docs/decisions.md`

### software-architect-agent
**Owns:** `docs/architecture.md`, `docs/api-contracts.md`, `docs/database-schema.md`,
`docs/file-structure.md`
**Read-only:** `docs/agent-brief.md`, `docs/product-requirements.md`, `docs/mvp-scope.md`,
`docs/decisions.md`

### frontend-developer-agent
**Owns:** `src/frontend/` (all files), `docs/demo-readiness.md` (frontend sections)
**Read-only:** `docs/ui-spec.md`, `docs/screen-map.md`, `docs/design-system.md`,
`docs/api-contracts.md`, `docs/file-structure.md`, `docs/mvp-scope.md`

### backend-developer-agent
**Owns:** `src/backend/` (all files)
**Read-only:** `docs/architecture.md`, `docs/api-contracts.md`, `docs/database-schema.md`,
`docs/file-structure.md`, `docs/mvp-scope.md`, `docs/ai-spec.md`

### ai-llm-engineer-agent
**Owns:** `docs/ai-spec.md`, `docs/model-routing.md`, `docs/prompt-injection-tests.md`,
`prompts/` (all files), `evals/` (all files), `src/ai/` (all files)
**Read-only:** `docs/agent-brief.md`, `docs/product-requirements.md`, `docs/mvp-scope.md`,
`docs/architecture.md`, `docs/database-schema.md`, `docs/decisions.md`

### qa-security-devops-agent
**Owns:** `docs/test-plan.md`, `docs/security-review.md`, `docs/deployment-runbook.md`,
`docs/red-team-report.md`, `docs/bug-list.md`, `.env.example`
**Read-only:** all docs/, all src/ (read-only), all prompts/, all evals/

---

## Conflict resolution rules

1. Agents may not overwrite files owned by another agent.
2. If an agent needs to modify another agent's file, it must propose the change and wait.
3. If ownership of a new file is unclear, the chief-of-staff-orchestrator resolves it.
4. If resolving ownership changes scope, architecture, security, AI behavior, or workflow,
   the chief-of-staff-orchestrator must ask the founder first (Level 3 decision).
5. `docs/agent-brief.md` is read-only for all agents. Only the founder or chief-of-staff
   may update it.

# Database Schema

**Purpose:** Authoritative database schema for Acta. Drizzle definitions live in
`src/backend/src/db/schema.ts`; migrations in `src/backend/src/db/migrations/`.
**Owner:** software-architect-agent
**Last updated:** 2026-05-10
**Status:** First real schema (teacher-assignment-policy) — D-016 through D-021

---

## Tables (current)

### `assignments` — identity + current-version pointer

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID (D-017) |
| `tenant_id` | text not null | institution boundary (D-019) |
| `instructor_id` | text not null | original creator |
| `current_version` | integer not null | pointer into `assignment_policy_versions.version` |
| `created_at` | timestamptz not null default now() | |
| `updated_at` | timestamptz not null default now() | bumped on PUT |

Index: `assignments_tenant_instructor_idx (tenant_id, instructor_id)`

### `assignment_policy_versions` — immutable history

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID — this is `policyVersionId`, the ledger anchor |
| `assignment_id` | text not null FK → `assignments.id` ON DELETE RESTRICT | |
| `tenant_id` | text not null | denormalized for tenant WHERE filters |
| `instructor_id` | text not null | author of THIS version |
| `version` | integer not null | 1, 2, 3, ... |
| `title` | text not null | 1..200 chars |
| `instructions` | text not null | 1..20,000 chars |
| `rubric` | text nullable | 0..20,000 chars |
| `ai_help` | jsonb not null | `AiHelpPolicy` JSON |
| `verification_mode` | text not null | check: `score \| gate \| fail_only` |
| `policy_hash` | text not null | SHA-256 hex of canonical version body |
| `created_at` | timestamptz not null default now() | effective timestamp |

Unique: `(assignment_id, version)`
Index: `apv_assignment_idx (assignment_id, version DESC)`, `apv_tenant_idx (tenant_id)`

---

## Invariants (D-018)

1. `assignment_policy_versions` rows are **never UPDATEd or DELETEd** from app code.
2. PUT `/v1/assignments/:id` inserts a new row and bumps `assignments.current_version` transactionally.
3. `policy_hash` is deterministic over the canonical JSON of the version body. Same body → same hash.
4. Cross-tenant access returns 404 at the API layer (D-019).

---

### `submissions` — immutable student work product

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID |
| `tenant_id` | text not null | institution boundary (D-019) |
| `assignment_id` | text not null FK → `assignments.id` ON DELETE RESTRICT | |
| `student_id` | text not null | placeholder identity (D-024) |
| `policy_version_id` | text not null FK → `assignment_policy_versions.id` ON DELETE RESTRICT | snapshot pin |
| `policy_version` | integer not null | snapshot pin |
| `policy_hash` | text not null | snapshot pin |
| `content` | text not null | 1..200,000 chars (D-028) |
| `content_hash` | text not null | SHA-256 hex of `content` (D-029) |
| `submitted_at` | timestamptz not null default now() | |

Indexes:
- `submissions_assignment_idx (assignment_id, submitted_at DESC)`
- `submissions_student_idx (tenant_id, student_id, submitted_at DESC)`
- `submissions_tenant_idx (tenant_id)`

**Invariants (D-027):**
1. `submissions` rows are never UPDATEd or DELETEd from app code.
2. `policy_version_id`, `policy_version`, `policy_hash` are snapshotted at submission time and frozen.
3. FK to `assignment_policy_versions` plus that table's append-only invariant means the chain is unbreakable.
4. `content_hash` is computed at write time so the future ledger event can anchor without re-exposing `content`.

---

### `concept_check_sets` — immutable generated check sets

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID |
| `tenant_id` | text not null | institution boundary |
| `assignment_id` | text not null FK → `assignments.id` ON DELETE RESTRICT | |
| `submission_id` | text not null FK → `submissions.id` ON DELETE RESTRICT | grounded against this exact submission |
| `student_id` | text not null | copied from submission |
| `policy_version_id` | text not null FK → `assignment_policy_versions.id` ON DELETE RESTRICT | snapshot pin |
| `policy_version` | integer not null | snapshot pin |
| `policy_hash` | text not null | snapshot pin |
| `submission_content_hash` | text not null | copied from `submissions.content_hash` at generation time |
| `questions` | jsonb not null | `ConceptCheckQuestion[]` |
| `question_count` | integer not null | denormalized for filters |
| `provider` | text not null | `"stub"` \| `"anthropic"` |
| `model` | text nullable | non-null for anthropic; null for stub |
| `generated_at` | timestamptz not null default now() | |

Indexes:
- `ccs_submission_idx (submission_id, generated_at DESC)`
- `ccs_tenant_student_idx (tenant_id, student_id)`
- `ccs_assignment_idx (assignment_id, generated_at DESC)`

**Invariants (D-031):**
1. Rows are never UPDATEd or DELETEd from app code.
2. `submission_content_hash`, `policy_version_id`, `policy_version`, `policy_hash` are snapshotted at generation time and frozen.
3. Raw submission text never appears in a future ledger event for these sets (D-029 / D-032).

**Additional nullable columns (D-041, migration 0006):**
- `reference_solution_id` text NULL — FK to `assignment_reference_solutions(id)` ON DELETE RESTRICT
- `reference_version` integer NULL
- `reference_hash` text NULL

These are populated when the route resolves the current `assignment_reference_solutions` row at generation time, and remain NULL when no reference exists for the assignment. Existing rows from before this migration retain NULL across all three.

**Questions JSONB shape:** `[{ id: string (ULID), ordinal: number, prompt: string, conceptTag?: string }]`. Stable IDs preserved per question so the future answer-capture feature can anchor responses without a schema migration.

---

### `concept_check_verifications` — immutable verification attempts

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID |
| `tenant_id` | text not null | institution boundary |
| `assignment_id` | text not null FK → `assignments.id` ON DELETE RESTRICT | |
| `submission_id` | text not null FK → `submissions.id` ON DELETE RESTRICT | |
| `concept_check_set_id` | text not null FK → `concept_check_sets.id` ON DELETE RESTRICT | |
| `student_id` | text not null | copied from set |
| `policy_version_id` | text not null FK → `assignment_policy_versions.id` ON DELETE RESTRICT | snapshot pin |
| `policy_version` | integer not null | snapshot pin |
| `policy_hash` | text not null | snapshot pin |
| `submission_content_hash` | text not null | snapshot pin |
| `answers` | jsonb not null | `Answer[]` |
| `result` | text not null | CHECK in (`pass`, `needs_review`, `fail`) |
| `overall_feedback` | text not null | 1–3 sentences |
| `per_question_feedback` | jsonb not null | `PerQuestionFeedback[]` |
| `provider` | text not null | `"stub"` \| `"anthropic"` |
| `model` | text nullable | non-null for anthropic |
| `evaluated_at` | timestamptz not null default now() | |

Indexes:
- `ccv_set_idx (concept_check_set_id, evaluated_at DESC)`
- `ccv_tenant_student_idx (tenant_id, student_id)`
- `ccv_submission_idx (submission_id, evaluated_at DESC)`

**Invariants (D-033):**
1. Rows are never UPDATEd or DELETEd from app code (interface omits both).
2. All snapshot pins (`submission_content_hash`, `policy_version_id`, `policy_version`, `policy_hash`, `concept_check_set_id`) are frozen at write time.
3. `result` is strictly one of `pass | needs_review | fail` (CHECK at DB layer + enum at type layer).
4. Raw `answers` and `per_question_feedback` live ONLY on this row — never copied into ledger event shapes (D-037).

**Additional nullable columns (D-041, migration 0006):**
- `reference_solution_id` text NULL — FK to `assignment_reference_solutions(id)` ON DELETE RESTRICT
- `reference_version` integer NULL
- `reference_hash` text NULL

Populated by the route when an Instructor Solution Guide exists at evaluation time; NULL otherwise.

---

### `assignment_reference_solutions` — instructor reference truth (append-only)

| Column | Type | Notes |
|--------|------|-------|
| `id` | text PK | ULID |
| `tenant_id` | text not null | |
| `assignment_id` | text not null FK → `assignments.id` ON DELETE RESTRICT | |
| `instructor_id` | text not null | author of this version |
| `version` | integer not null | 1, 2, 3, ... |
| `expected_solution` | text not null | 1..50,000 chars (D-039) |
| `key_concepts` | jsonb not null | string[] (D-040 — order preserved) |
| `required_reasoning_steps` | jsonb not null | string[] |
| `common_mistakes` | jsonb not null | string[] |
| `correctness_criteria` | text not null | 1..10,000 chars |
| `optional_notes` | text nullable | 0..10,000 chars; instructor-only |
| `reference_hash` | text not null | SHA-256 hex of canonical body (D-040) |
| `created_at` | timestamptz not null default now() | |

Unique: `(assignment_id, version)`. Indexes: `(assignment_id, version DESC)`, `(tenant_id)`.

**Invariants (D-038):**
1. Rows are never UPDATEd or DELETEd from app code.
2. "Current" = `ORDER BY version DESC LIMIT 1` (no `current_version` pointer column).
3. List ordering (`keyConcepts` etc.) is meaningful — reordering produces a new `referenceHash`.
4. Students NEVER read this table at the API layer (route + repo enforce instructor-only access; D-019 privacy semantics → 404, not 403).

---

## Reserved future tables (not in this feature)

- `ledger_events` — append-only ledger entries (C2). Will reference `policyVersionId`, `submissionId`, `conceptCheckSetId`, `verificationId`, `referenceSolutionId`.
- `grades` — final grading (out of scope for v1).

---

## Notes

- Postgres row-level security (RLS) is a future hardening step. v1 uses app-level WHERE clauses (D-019).
- Production database provider is a DEFERRED L3 decision. Local Docker Postgres (D-010) is the only approved host at this stage.

-- 0001_assignment_policy.sql
-- Initial schema for the teacher-assignment-policy feature.
-- D-018: assignment_policy_versions rows are immutable from app code.

CREATE TABLE IF NOT EXISTS assignments (
  id              text PRIMARY KEY,
  tenant_id       text NOT NULL,
  instructor_id   text NOT NULL,
  current_version integer NOT NULL,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS assignments_tenant_instructor_idx
  ON assignments(tenant_id, instructor_id);

CREATE TABLE IF NOT EXISTS assignment_policy_versions (
  id                text PRIMARY KEY,
  assignment_id     text NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  tenant_id         text NOT NULL,
  instructor_id     text NOT NULL,
  version           integer NOT NULL,
  title             text NOT NULL,
  instructions      text NOT NULL,
  rubric            text,
  ai_help           jsonb NOT NULL,
  verification_mode text NOT NULL CHECK (verification_mode IN ('score','gate','fail_only')),
  policy_hash       text NOT NULL,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS apv_assignment_version_unique
  ON assignment_policy_versions(assignment_id, version);

CREATE INDEX IF NOT EXISTS apv_assignment_idx
  ON assignment_policy_versions(assignment_id, version);

CREATE INDEX IF NOT EXISTS apv_tenant_idx
  ON assignment_policy_versions(tenant_id);

-- 0005_assignment_reference_solutions.sql
-- Append-only instructor reference solutions (D-038). Trusted evaluation context.

CREATE TABLE IF NOT EXISTS assignment_reference_solutions (
  id                          text PRIMARY KEY,
  tenant_id                   text NOT NULL,
  assignment_id               text NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  instructor_id               text NOT NULL,
  version                     integer NOT NULL,
  expected_solution           text NOT NULL,
  key_concepts                jsonb NOT NULL,
  required_reasoning_steps    jsonb NOT NULL,
  common_mistakes             jsonb NOT NULL,
  correctness_criteria        text NOT NULL,
  optional_notes              text,
  reference_hash              text NOT NULL,
  created_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS ars_assignment_version_unique
  ON assignment_reference_solutions(assignment_id, version);

CREATE INDEX IF NOT EXISTS ars_assignment_idx
  ON assignment_reference_solutions(assignment_id, version);

CREATE INDEX IF NOT EXISTS ars_tenant_idx
  ON assignment_reference_solutions(tenant_id);

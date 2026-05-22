-- 0003_concept_check_sets.sql
-- Append-only generated concept-check sets (D-031). Submission + policy snapshots frozen.

CREATE TABLE IF NOT EXISTS concept_check_sets (
  id                      text PRIMARY KEY,
  tenant_id               text NOT NULL,
  assignment_id           text NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  submission_id           text NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  student_id              text NOT NULL,
  policy_version_id       text NOT NULL REFERENCES assignment_policy_versions(id) ON DELETE RESTRICT,
  policy_version          integer NOT NULL,
  policy_hash             text NOT NULL,
  submission_content_hash text NOT NULL,
  questions               jsonb NOT NULL,
  question_count          integer NOT NULL,
  provider                text NOT NULL,
  model                   text,
  generated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ccs_submission_idx
  ON concept_check_sets(submission_id, generated_at DESC);

CREATE INDEX IF NOT EXISTS ccs_tenant_student_idx
  ON concept_check_sets(tenant_id, student_id);

CREATE INDEX IF NOT EXISTS ccs_assignment_idx
  ON concept_check_sets(assignment_id, generated_at DESC);

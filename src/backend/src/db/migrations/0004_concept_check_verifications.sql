-- 0004_concept_check_verifications.sql
-- Append-only verification attempts (D-033). Result is a verification SIGNAL only —
-- not final grading, not a course grade.

CREATE TABLE IF NOT EXISTS concept_check_verifications (
  id                      text PRIMARY KEY,
  tenant_id               text NOT NULL,
  assignment_id           text NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  submission_id           text NOT NULL REFERENCES submissions(id) ON DELETE RESTRICT,
  concept_check_set_id    text NOT NULL REFERENCES concept_check_sets(id) ON DELETE RESTRICT,
  student_id              text NOT NULL,
  policy_version_id       text NOT NULL REFERENCES assignment_policy_versions(id) ON DELETE RESTRICT,
  policy_version          integer NOT NULL,
  policy_hash             text NOT NULL,
  submission_content_hash text NOT NULL,
  answers                 jsonb NOT NULL,
  result                  text NOT NULL CHECK (result IN ('pass','needs_review','fail')),
  overall_feedback        text NOT NULL,
  per_question_feedback   jsonb NOT NULL,
  provider                text NOT NULL,
  model                   text,
  evaluated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS ccv_set_idx
  ON concept_check_verifications(concept_check_set_id, evaluated_at DESC);

CREATE INDEX IF NOT EXISTS ccv_tenant_student_idx
  ON concept_check_verifications(tenant_id, student_id);

CREATE INDEX IF NOT EXISTS ccv_submission_idx
  ON concept_check_verifications(submission_id, evaluated_at DESC);

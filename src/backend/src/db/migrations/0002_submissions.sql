-- 0002_submissions.sql
-- Append-only student submissions (D-027). Policy snapshot is frozen at insert time.

CREATE TABLE IF NOT EXISTS submissions (
  id                  text PRIMARY KEY,
  tenant_id           text NOT NULL,
  assignment_id       text NOT NULL REFERENCES assignments(id) ON DELETE RESTRICT,
  student_id          text NOT NULL,
  policy_version_id   text NOT NULL REFERENCES assignment_policy_versions(id) ON DELETE RESTRICT,
  policy_version      integer NOT NULL,
  policy_hash         text NOT NULL,
  content             text NOT NULL,
  content_hash        text NOT NULL,
  submitted_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS submissions_assignment_idx
  ON submissions(assignment_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS submissions_student_idx
  ON submissions(tenant_id, student_id, submitted_at DESC);

CREATE INDEX IF NOT EXISTS submissions_tenant_idx
  ON submissions(tenant_id);

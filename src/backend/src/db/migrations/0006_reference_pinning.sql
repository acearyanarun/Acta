-- 0006_reference_pinning.sql
-- D-041: add nullable reference pin columns to concept_check_sets and
-- concept_check_verifications. Existing rows are NOT backfilled.

ALTER TABLE concept_check_sets
  ADD COLUMN IF NOT EXISTS reference_solution_id text
    REFERENCES assignment_reference_solutions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS reference_version integer,
  ADD COLUMN IF NOT EXISTS reference_hash    text;

ALTER TABLE concept_check_verifications
  ADD COLUMN IF NOT EXISTS reference_solution_id text
    REFERENCES assignment_reference_solutions(id) ON DELETE RESTRICT,
  ADD COLUMN IF NOT EXISTS reference_version integer,
  ADD COLUMN IF NOT EXISTS reference_hash    text;

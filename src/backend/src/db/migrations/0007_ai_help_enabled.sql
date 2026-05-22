-- 0007_ai_help_enabled.sql
-- D-047: assignment-level AI help master toggle.
-- Adds `ai_help_enabled` to assignment_policy_versions. Defaults to TRUE so
-- pre-existing policy rows (and any in-flight demo data) continue to behave
-- exactly as before. The column is hash-included via the application layer
-- (computePolicyHash), so future writes that flip the toggle will produce a
-- different policy_hash even if every other field is identical.
--
-- Append-only invariant preserved: existing rows are not rewritten; only the
-- column default fills in for them. No backfill rewrite required.

ALTER TABLE assignment_policy_versions
  ADD COLUMN IF NOT EXISTS ai_help_enabled boolean NOT NULL DEFAULT true;

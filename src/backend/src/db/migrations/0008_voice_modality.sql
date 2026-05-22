-- 0008_voice_modality.sql
-- D-048: assignment-agnostic voice modality on concept-check verifications.
-- Adds `has_voice_answers` to concept_check_verifications. Defaults to FALSE
-- so all pre-existing verification rows behave exactly as before (no voice
-- answers). Per-answer modality + transcriptHash + transcription provider/model
-- live inside the existing jsonb `answers` column — no schema change there.
--
-- NO audio column is created. Ever. Raw audio is held in an in-memory Buffer
-- in the transcribe route handler and discarded after the response.

ALTER TABLE concept_check_verifications
  ADD COLUMN IF NOT EXISTS has_voice_answers boolean NOT NULL DEFAULT false;

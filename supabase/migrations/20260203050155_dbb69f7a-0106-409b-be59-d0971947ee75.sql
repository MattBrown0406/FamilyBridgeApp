-- Remove redundant include_in_fiis column since include_in_ai_analysis already exists and is used
ALTER TABLE public.provider_notes DROP COLUMN IF EXISTS include_in_fiis;
DROP INDEX IF EXISTS idx_provider_notes_include_in_fiis;
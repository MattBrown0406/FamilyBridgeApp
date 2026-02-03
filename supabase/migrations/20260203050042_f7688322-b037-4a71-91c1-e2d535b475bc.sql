-- Add include_in_fiis column to provider_notes table
-- This allows providers to opt-in specific notes for AI analysis

ALTER TABLE public.provider_notes 
ADD COLUMN IF NOT EXISTS include_in_fiis boolean NOT NULL DEFAULT false;

-- Add index for efficient querying of AI-included notes
CREATE INDEX IF NOT EXISTS idx_provider_notes_include_in_fiis 
ON public.provider_notes (family_id, include_in_fiis) 
WHERE include_in_fiis = true;

-- Add helpful comment
COMMENT ON COLUMN public.provider_notes.include_in_fiis IS 'When true, this note will be included in FIIS pattern analysis. Only clinical observations appropriate for AI aggregation should be marked true.';
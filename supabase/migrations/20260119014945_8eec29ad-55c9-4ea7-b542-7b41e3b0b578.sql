-- Add consequence column to family_boundaries table
ALTER TABLE public.family_boundaries
ADD COLUMN consequence text;

-- Add a comment explaining the field
COMMENT ON COLUMN public.family_boundaries.consequence IS 'The consequence that will occur if this boundary is violated. Required for meaningful boundaries.';
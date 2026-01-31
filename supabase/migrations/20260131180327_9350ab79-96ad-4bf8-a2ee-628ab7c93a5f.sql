-- Add author_name field to track who wrote the boundary (before they join)
ALTER TABLE public.family_boundaries 
ADD COLUMN IF NOT EXISTS author_name text,
ADD COLUMN IF NOT EXISTS author_matched_user_id uuid;

-- Add comment explaining the fields
COMMENT ON COLUMN public.family_boundaries.author_name IS 
'Name of the person who wrote this boundary in their intervention letter. Used before they join the family group.';

COMMENT ON COLUMN public.family_boundaries.author_matched_user_id IS 
'User ID matched to author_name when they join the family. NULL until matched.';
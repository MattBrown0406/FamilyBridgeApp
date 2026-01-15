-- Add is_archived column to families table
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS is_archived boolean NOT NULL DEFAULT false;

-- Add archived_at and archived_by columns for audit trail
ALTER TABLE public.families 
ADD COLUMN IF NOT EXISTS archived_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS archived_by uuid;

-- Create index for faster filtering of active/archived families
CREATE INDEX IF NOT EXISTS idx_families_is_archived ON public.families(is_archived);

-- Update RLS policies to account for archived status where needed
-- Moderators can archive families they moderate
CREATE POLICY "Moderators can archive their families"
ON public.families
FOR UPDATE
TO authenticated
USING (
  public.is_family_moderator(id, auth.uid())
  OR public.is_super_admin(auth.uid())
)
WITH CHECK (
  public.is_family_moderator(id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Add comment for documentation
COMMENT ON COLUMN public.families.is_archived IS 'Whether the family group has been archived by a moderator';
COMMENT ON COLUMN public.families.archived_at IS 'Timestamp when the family was archived';
COMMENT ON COLUMN public.families.archived_by IS 'User ID of who archived the family';
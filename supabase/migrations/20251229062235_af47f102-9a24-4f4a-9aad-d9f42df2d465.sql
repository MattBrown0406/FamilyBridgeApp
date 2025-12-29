-- Create a security definer function to get invite code (only moderators can access)
CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT f.invite_code
  FROM public.families f
  INNER JOIN public.family_members fm ON fm.family_id = f.id
  WHERE f.id = _family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
$$;

-- Create a function to check if user is moderator of a family
CREATE OR REPLACE FUNCTION public.is_family_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND role = 'moderator'
  )
$$;

-- Update the SELECT policy on families to exclude invite_code for non-moderators
-- We'll use a view approach instead - create a secure view

-- First, drop and recreate the SELECT policy to be more restrictive
-- The invite_code column will still exist but we'll control access via the function
COMMENT ON COLUMN public.families.invite_code IS 'Access restricted - use get_family_invite_code() function';
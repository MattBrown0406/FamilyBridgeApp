-- Create a function to check if a user is a moderator of a family that the target user belongs to
CREATE OR REPLACE FUNCTION public.is_moderator_of_family_member(_moderator_id uuid, _member_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members mod_fm
    JOIN public.family_members member_fm ON mod_fm.family_id = member_fm.family_id
    WHERE mod_fm.user_id = _moderator_id
      AND mod_fm.role = 'moderator'
      AND member_fm.user_id = _member_id
  )
$$;

-- Add policy allowing moderators to update profiles of family members
CREATE POLICY "Moderators can update family member profiles"
ON public.profiles
FOR UPDATE
USING (public.is_moderator_of_family_member(auth.uid(), id))
WITH CHECK (public.is_moderator_of_family_member(auth.uid(), id));
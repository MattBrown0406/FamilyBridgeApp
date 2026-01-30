-- Harden profiles table RLS to restrict access to authorized users only

-- 1. Create helper function to check if user can view a profile
CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id UUID, _profile_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- User can always view own profile
    _viewer_id = _profile_id
    -- Super admin can view all
    OR public.is_super_admin(_viewer_id)
    -- Same family membership
    OR EXISTS (
      SELECT 1 
      FROM family_members viewer_fm
      JOIN family_members profile_fm ON viewer_fm.family_id = profile_fm.family_id
      WHERE viewer_fm.user_id = _viewer_id
        AND profile_fm.user_id = _profile_id
    )
    -- Organization staff can view profiles of families they manage
    OR EXISTS (
      SELECT 1
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      JOIN organization_members om ON om.organization_id = f.organization_id
      WHERE fm.user_id = _profile_id
        AND om.user_id = _viewer_id
    )
    -- Temporary moderator can view profiles of families they moderate
    OR EXISTS (
      SELECT 1
      FROM temporary_moderator_requests tmr
      JOIN family_members fm ON fm.family_id = tmr.family_id
      WHERE tmr.assigned_moderator_id = _viewer_id
        AND tmr.status = 'active'
        AND tmr.expires_at > now()
        AND fm.user_id = _profile_id
    )
    -- Paid moderator can view profiles of families they moderate
    OR EXISTS (
      SELECT 1
      FROM paid_moderator_requests pmr
      JOIN family_members fm ON fm.family_id = pmr.family_id
      WHERE pmr.assigned_moderator_id = _viewer_id
        AND pmr.status = 'active'
        AND fm.user_id = _profile_id
    )
$$;

-- 2. Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or super admins can view all" ON public.profiles;

-- 3. Create new restrictive SELECT policy
CREATE POLICY "Authorized users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.can_view_profile(auth.uid(), id));

-- 4. Explicitly deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous profile access" ON public.profiles;
CREATE POLICY "Deny anonymous profile access"
ON public.profiles
FOR SELECT
TO anon
USING (false);

-- 5. Add comment documenting security model
COMMENT ON TABLE public.profiles IS 
'User profiles with restricted visibility. SELECT access is controlled by can_view_profile() function which allows:
- Users viewing their own profile
- Super admins viewing all profiles
- Family members viewing profiles of users in their family
- Organization staff viewing profiles of families they manage
- Temporary/paid moderators viewing profiles of families they moderate
Direct enumeration is blocked - users can only see profiles they have a legitimate relationship with.';
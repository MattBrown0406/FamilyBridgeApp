-- Drop all existing SELECT policies on profiles table
DROP POLICY IF EXISTS "Authenticated users can view profiles in their families" ON public.profiles;
DROP POLICY IF EXISTS "Professional moderators can view assigned family profiles" ON public.profiles;
DROP POLICY IF EXISTS "Profiles visible to self or same family" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of family members" ON public.profiles;

-- Create a single consolidated SELECT policy
CREATE POLICY "Users can view profiles they have access to"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always view their own profile
  auth.uid() = id
  OR
  -- Users can view profiles of people in their families
  EXISTS (
    SELECT 1
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() AND fm2.user_id = profiles.id
  )
  OR
  -- Super admins can view all profiles
  public.is_super_admin(auth.uid())
  OR
  -- Organization admins can view profiles of their org's family members
  EXISTS (
    SELECT 1
    FROM organization_members om
    JOIN families f ON f.organization_id = om.organization_id
    JOIN family_members fm ON fm.family_id = f.id
    WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin')
    AND fm.user_id = profiles.id
  )
  OR
  -- Active professional moderators can view assigned family profiles
  EXISTS (
    SELECT 1
    FROM temporary_moderator_requests tmr
    JOIN family_members fm ON fm.family_id = tmr.family_id
    WHERE tmr.assigned_moderator_id = auth.uid()
    AND tmr.status = 'active'
    AND tmr.expires_at > now()
    AND fm.user_id = profiles.id
  )
  OR
  EXISTS (
    SELECT 1
    FROM paid_moderator_requests pmr
    JOIN family_members fm ON fm.family_id = pmr.family_id
    WHERE pmr.assigned_moderator_id = auth.uid()
    AND pmr.status = 'active'
    AND (pmr.expires_at IS NULL OR pmr.expires_at > now())
    AND fm.user_id = profiles.id
  )
);
-- Drop the existing policy that allows temporary moderators to see profiles
DROP POLICY IF EXISTS "Profiles visible to related users" ON public.profiles;

-- Create a more restrictive policy that excludes temporary moderators
-- Only permanent family members and organization staff can see profiles
CREATE POLICY "Profiles visible to permanent members only"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Users can always see their own profile
  auth.uid() = id
  -- Super admins can see all profiles
  OR is_super_admin(auth.uid())
  -- Users in the same family (permanent members only, not temp moderators)
  OR EXISTS (
    SELECT 1
    FROM family_members fm_me
    JOIN family_members fm_them ON fm_me.family_id = fm_them.family_id
    WHERE fm_me.user_id = auth.uid()
      AND fm_them.user_id = profiles.id
  )
  -- Users in the same organization (permanent staff only)
  OR EXISTS (
    SELECT 1
    FROM organization_members om_me
    JOIN organization_members om_them ON om_me.organization_id = om_them.organization_id
    WHERE om_me.user_id = auth.uid()
      AND om_them.user_id = profiles.id
  )
);

-- Drop the overly permissive policy that allows any org-related user to see family member profiles
DROP POLICY IF EXISTS "Org members can view profiles of org family members" ON public.profiles;

-- Create a more restrictive policy: Only org STAFF (not family members) can view profiles of users in their org's families
-- This is necessary for clinical workflows where providers need to see family member information
CREATE POLICY "Org staff can view profiles of org family members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- User is an organization staff member (not a family member)
  EXISTS (
    SELECT 1
    FROM organization_members om
    WHERE om.user_id = auth.uid()
  )
  AND
  -- And the profile belongs to someone in a family managed by that organization
  EXISTS (
    SELECT 1
    FROM family_members fm
    JOIN families f ON f.id = fm.family_id
    JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE fm.user_id = profiles.id
      AND om.user_id = auth.uid()
  )
);

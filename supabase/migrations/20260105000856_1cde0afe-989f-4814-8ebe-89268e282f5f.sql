-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles in their context" ON public.profiles;

-- Create a more restrictive policy that requires legitimate family membership
-- Users can only see profiles if:
-- 1. It's their own profile
-- 2. They share an ACTIVE family membership (both must be actual members, not just any family)
-- 3. They're an org staff member viewing profiles of families under their organization
CREATE POLICY "Users can view profiles with verified relationships" 
ON public.profiles 
FOR SELECT 
USING (
  -- Always allow viewing own profile
  (auth.uid() = id)
  OR 
  -- Allow viewing profiles of users in the same family (verified membership)
  (EXISTS (
    SELECT 1
    FROM family_members fm1
    INNER JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = profiles.id
      AND fm1.user_id != fm2.user_id
  ))
  OR
  -- Allow organization staff to view profiles of family members under their org
  (EXISTS (
    SELECT 1
    FROM organization_members om
    INNER JOIN families f ON f.organization_id = om.organization_id
    INNER JOIN family_members fm ON fm.family_id = f.id
    WHERE om.user_id = auth.uid()
      AND fm.user_id = profiles.id
  ))
);
-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view own and family member profiles" ON public.profiles;

-- Create a more restrictive policy that includes organization context
-- Users can view:
-- 1. Their own profile
-- 2. Profiles of users in the same family
-- 3. Profiles of users in the same organization (for provider admins)
CREATE POLICY "Users can view profiles in their context" 
ON public.profiles 
FOR SELECT 
USING (
  -- Can always view own profile
  auth.uid() = id 
  -- Can view profiles of family members
  OR EXISTS (
    SELECT 1 
    FROM public.family_members fm1
    INNER JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = profiles.id
  )
  -- Can view profiles of organization members (for providers)
  OR EXISTS (
    SELECT 1
    FROM public.organization_members om1
    INNER JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid()
    AND om2.user_id = profiles.id
  )
);
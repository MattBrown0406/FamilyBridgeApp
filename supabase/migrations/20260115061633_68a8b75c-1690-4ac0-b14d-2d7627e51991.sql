-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated users can view profiles" ON public.profiles;

-- Create restricted policy - users can only see profiles of people they share a family or org with
CREATE POLICY "Users can view related profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Can always see own profile
  auth.uid() = id
  OR
  -- Can see profiles of users in same family
  public.shares_family_with(auth.uid(), id)
  OR
  -- Can see profiles of users in same organization
  EXISTS (
    SELECT 1 FROM public.organization_members om1
    JOIN public.organization_members om2 ON om1.organization_id = om2.organization_id
    WHERE om1.user_id = auth.uid() AND om2.user_id = profiles.id
  )
  OR
  -- Super admins can see all profiles
  public.is_super_admin(auth.uid())
);

-- Add comment explaining the policy
COMMENT ON POLICY "Users can view related profiles" ON public.profiles IS 'Restricts profile visibility to own profile, family members, organization colleagues, or super admins';
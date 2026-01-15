-- Drop the current policy
DROP POLICY IF EXISTS "Users can view related profiles" ON public.profiles;

-- Create a security definer function to check if users are in the same family
CREATE OR REPLACE FUNCTION public.is_in_same_family(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 
    FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = _user_id 
      AND fm2.user_id = _other_user_id
  )
$$;

-- Create more restrictive policy
CREATE POLICY "Users can view profiles in same family or org"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  -- Can always see own profile
  auth.uid() = id
  OR
  -- Can see profiles of users in the SAME family (not across families)
  public.is_in_same_family(auth.uid(), id)
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
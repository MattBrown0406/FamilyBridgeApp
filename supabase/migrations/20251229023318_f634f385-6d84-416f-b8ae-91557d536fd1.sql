-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create a new policy that only allows viewing profiles of family members
CREATE POLICY "Users can view profiles of family members"
ON public.profiles
FOR SELECT
USING (
  -- Allow users to view their own profile
  auth.uid() = id
  OR
  -- Allow users to view profiles of members in their families
  EXISTS (
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
    AND fm2.user_id = profiles.id
  )
);
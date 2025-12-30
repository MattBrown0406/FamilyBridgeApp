-- Create a security definer function to check if two users share a family
CREATE OR REPLACE FUNCTION public.shares_family_with(_user_id uuid, _other_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members fm1
    INNER JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = _user_id
      AND fm2.user_id = _other_user_id
  )
$$;

-- Drop the existing policy
DROP POLICY IF EXISTS "Users can view profiles of family members" ON public.profiles;

-- Create new policy using the security definer function
CREATE POLICY "Users can view profiles of family members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id 
  OR public.shares_family_with(auth.uid(), id)
);
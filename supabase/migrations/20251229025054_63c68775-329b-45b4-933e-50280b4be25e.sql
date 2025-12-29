-- Create a security definer function to check family membership without recursion
CREATE OR REPLACE FUNCTION public.is_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
  )
$$;

-- Drop existing problematic policies on family_members
DROP POLICY IF EXISTS "Users can view members of their families" ON public.family_members;
DROP POLICY IF EXISTS "Moderators can update member roles" ON public.family_members;

-- Recreate policies using the security definer function
CREATE POLICY "Users can view members of their families"
ON public.family_members
FOR SELECT
USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Moderators can update member roles"
ON public.family_members
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = family_members.family_id 
    AND fm.user_id = auth.uid() 
    AND fm.role = 'moderator'
  )
);

-- Drop and recreate the families SELECT policy
DROP POLICY IF EXISTS "Users can view families they belong to" ON public.families;

CREATE POLICY "Users can view families they belong to"
ON public.families
FOR SELECT
USING (public.is_family_member(id, auth.uid()));
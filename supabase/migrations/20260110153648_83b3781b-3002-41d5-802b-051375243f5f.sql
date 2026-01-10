-- Drop existing SELECT policies that use 'public' role
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of direct family members" ON public.profiles;

-- Recreate SELECT policies with 'authenticated' role only
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of direct family members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() 
      AND fm2.user_id = profiles.id
  )
);
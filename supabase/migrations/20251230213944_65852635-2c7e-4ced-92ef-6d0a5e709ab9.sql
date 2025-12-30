-- Drop existing SELECT policy and recreate with explicit authentication requirement
DROP POLICY IF EXISTS "Users can view profiles of family members" ON public.profiles;

-- Recreate with explicit TO authenticated clause to prevent unauthenticated access
CREATE POLICY "Users can view profiles of family members" 
ON public.profiles 
FOR SELECT 
TO authenticated
USING ((auth.uid() = id) OR shares_family_with(auth.uid(), id));
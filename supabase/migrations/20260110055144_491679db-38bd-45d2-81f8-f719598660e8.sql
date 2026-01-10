-- Drop the overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view own profile or shared-family profiles" ON public.profiles;

-- Create a more restrictive policy: users can only view their own profile
-- Other profile data access should happen through specific joins in queries
CREATE POLICY "Users can view own profile" 
ON public.profiles 
FOR SELECT 
USING (auth.uid() = id);

-- Create a separate policy for viewing family member profiles only within family context
-- This is more restrictive - only allows viewing profiles of members in the SAME family as the requesting user
CREATE POLICY "Users can view profiles of direct family members" 
ON public.profiles 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = profiles.id
    AND fm1.family_id = fm2.family_id
  )
);
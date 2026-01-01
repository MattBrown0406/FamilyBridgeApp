-- Drop the existing policy that's too broad
DROP POLICY IF EXISTS "Authenticated users can view family profiles" ON public.profiles;

-- Create a more restrictive policy that only allows viewing profiles of users in the SAME family
-- This is more secure than shares_family_with which could be exploited
CREATE POLICY "Users can view own and family member profiles" 
ON public.profiles 
FOR SELECT 
USING (
  auth.uid() = id 
  OR EXISTS (
    SELECT 1 
    FROM public.family_members fm1
    INNER JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() 
    AND fm2.user_id = profiles.id
  )
);
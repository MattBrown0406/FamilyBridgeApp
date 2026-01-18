-- Drop and recreate the INSERT policy with clearer logic
DROP POLICY IF EXISTS "Users can acknowledge disclaimer" ON public.fiis_disclaimer_acknowledgments;

CREATE POLICY "Users can acknowledge disclaimer" 
ON public.fiis_disclaimer_acknowledgments 
FOR INSERT 
TO authenticated
WITH CHECK (
  auth.uid() = user_id 
  AND public.is_family_member(family_id, auth.uid())
);
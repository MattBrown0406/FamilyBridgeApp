-- Drop and recreate the INSERT policy to require family membership
DROP POLICY IF EXISTS "Users can acknowledge disclaimer" ON public.fiis_disclaimer_acknowledgments;

CREATE POLICY "Users can acknowledge disclaimer" 
ON public.fiis_disclaimer_acknowledgments 
FOR INSERT 
WITH CHECK (
  auth.uid() = user_id 
  AND is_family_member(family_id, auth.uid())
);
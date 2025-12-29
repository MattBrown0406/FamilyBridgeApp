-- Add restrictive policy to require authentication for families table
CREATE POLICY "Require authentication for families"
ON public.families
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);
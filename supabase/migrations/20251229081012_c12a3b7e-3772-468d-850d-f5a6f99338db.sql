-- Add restrictive policy to require authentication for profiles table
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);
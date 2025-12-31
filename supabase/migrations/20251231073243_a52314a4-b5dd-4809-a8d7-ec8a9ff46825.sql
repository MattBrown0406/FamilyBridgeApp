-- Add explicit deny policy for anonymous/unauthenticated access to profiles
-- This ensures only authenticated users can view profiles

CREATE POLICY "Block anonymous access"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);
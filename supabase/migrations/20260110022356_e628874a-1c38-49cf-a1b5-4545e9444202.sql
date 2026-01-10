-- Add restrictive policy to block all anonymous (unauthenticated) access to profiles
CREATE POLICY "Block anonymous access to profiles" 
ON public.profiles 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);
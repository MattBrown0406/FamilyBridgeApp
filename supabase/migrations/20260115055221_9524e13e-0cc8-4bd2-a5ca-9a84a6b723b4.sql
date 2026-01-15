-- Fix the anonymous blocking policy by making it RESTRICTIVE
-- A PERMISSIVE policy with USING(false) doesn't block - it just doesn't grant access
-- But with other PERMISSIVE policies existing, we need RESTRICTIVE to actually deny

DROP POLICY IF EXISTS "Block anonymous access to profiles" ON public.profiles;

-- Create a restrictive policy that blocks anonymous users
CREATE POLICY "Block anonymous access to profiles"
ON public.profiles
AS RESTRICTIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
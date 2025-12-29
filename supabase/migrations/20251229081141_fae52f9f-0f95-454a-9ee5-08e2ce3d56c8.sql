-- Drop the existing policy and recreate with proper authentication requirement
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;

-- Create restrictive policy that only allows authenticated users
CREATE POLICY "Require authentication for profiles"
ON public.profiles
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (true);
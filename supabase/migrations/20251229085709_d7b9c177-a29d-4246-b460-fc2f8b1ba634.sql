-- Remove the overly permissive "Require authentication for profiles" policy
-- This policy allows ANY authenticated user to read ALL profiles, which is a security issue
DROP POLICY IF EXISTS "Require authentication for profiles" ON public.profiles;
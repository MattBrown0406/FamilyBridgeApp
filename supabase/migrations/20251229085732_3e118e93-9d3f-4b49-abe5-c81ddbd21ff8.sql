-- Remove the overly permissive "Require authentication for families" policy
-- This policy allows ANY authenticated user to read ALL families, which is a security issue
DROP POLICY IF EXISTS "Require authentication for families" ON public.families;

-- Fix HIPAA releases RLS: Ensure no direct SELECT access
-- Drop all existing SELECT policies and create restrictive one
DROP POLICY IF EXISTS "SELECT via views only" ON public.hipaa_releases;
DROP POLICY IF EXISTS "No direct SELECT - use secure functions" ON public.hipaa_releases;

-- Block ALL direct SELECT - must use views or functions
CREATE POLICY "No direct table access"
ON public.hipaa_releases
FOR SELECT
USING (false);

-- Verify UPDATE and DELETE are also blocked
DROP POLICY IF EXISTS "No updates allowed" ON public.hipaa_releases;
CREATE POLICY "No updates allowed"
ON public.hipaa_releases
FOR UPDATE
USING (false);

DROP POLICY IF EXISTS "No deletes allowed" ON public.hipaa_releases;
CREATE POLICY "No deletes allowed"
ON public.hipaa_releases
FOR DELETE
USING (false);

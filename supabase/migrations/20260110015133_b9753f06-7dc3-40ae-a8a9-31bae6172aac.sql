-- Fix the overly permissive INSERT policy on fiis_auto_events
-- This table should only be written by service_role (backend functions)
DROP POLICY IF EXISTS "Service role can insert auto events" ON public.fiis_auto_events;

-- Revoke INSERT from client roles - only service_role should insert
REVOKE INSERT ON public.fiis_auto_events FROM anon;
REVOKE INSERT ON public.fiis_auto_events FROM authenticated;
GRANT ALL ON public.fiis_auto_events TO service_role;

COMMENT ON TABLE public.fiis_auto_events IS 'Auto-logged events - INSERT only via service_role backend functions';
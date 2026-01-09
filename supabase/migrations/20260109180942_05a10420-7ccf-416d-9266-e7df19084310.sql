-- Ensure RLS is enabled and forced on premium_waitlist
ALTER TABLE public.premium_waitlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.premium_waitlist FORCE ROW LEVEL SECURITY;

-- Drop existing policies and recreate with proper protection
DROP POLICY IF EXISTS "Service role can view waitlist" ON public.premium_waitlist;
DROP POLICY IF EXISTS "Anyone can join the waitlist" ON public.premium_waitlist;
DROP POLICY IF EXISTS "Deny all reads (anon)" ON public.premium_waitlist;
DROP POLICY IF EXISTS "Deny all reads (authenticated)" ON public.premium_waitlist;

-- Allow inserts with email validation (public signup)
CREATE POLICY "Anyone can join the waitlist"
ON public.premium_waitlist
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND length(email) >= 3 
  AND length(email) <= 320 
  AND position('@' IN email) > 1
);

-- Deny all reads for anon
CREATE POLICY "Deny all reads (anon)"
ON public.premium_waitlist
FOR SELECT
TO anon
USING (false);

-- Deny all reads for authenticated
CREATE POLICY "Deny all reads (authenticated)"
ON public.premium_waitlist
FOR SELECT
TO authenticated
USING (false);

-- Defense in depth: revoke SELECT privilege from client roles
REVOKE SELECT ON TABLE public.premium_waitlist FROM anon;
REVOKE SELECT ON TABLE public.premium_waitlist FROM authenticated;

-- Ensure service_role can still manage the table
GRANT ALL ON TABLE public.premium_waitlist TO service_role;

COMMENT ON TABLE public.premium_waitlist IS 'Waitlist emails are managed only by backend/service role. Direct client reads are denied via RLS + revoked privileges.';
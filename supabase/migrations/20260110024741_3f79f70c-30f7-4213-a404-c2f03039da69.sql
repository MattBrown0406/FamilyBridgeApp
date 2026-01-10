-- Drop the existing permissive SELECT policies that don't properly block access
DROP POLICY IF EXISTS "Deny all reads (anon)" ON public.premium_waitlist;
DROP POLICY IF EXISTS "Deny all reads (authenticated)" ON public.premium_waitlist;

-- Create RESTRICTIVE policies that properly block all SELECT access
CREATE POLICY "Block all reads"
ON public.premium_waitlist
AS RESTRICTIVE
FOR SELECT
TO anon, authenticated
USING (false);

-- Add a comment documenting the security configuration
COMMENT ON TABLE public.premium_waitlist IS 'Marketing waitlist containing customer emails. All reads are blocked via RLS - only accessible via service role in edge functions.';
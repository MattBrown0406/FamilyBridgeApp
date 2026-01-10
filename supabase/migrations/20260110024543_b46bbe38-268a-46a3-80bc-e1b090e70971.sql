-- Drop existing permissive policies and replace with restrictive ones
DROP POLICY IF EXISTS "Block all client reads" ON public.activation_codes;
DROP POLICY IF EXISTS "Block client deletes" ON public.activation_codes;
DROP POLICY IF EXISTS "Block client updates" ON public.activation_codes;
DROP POLICY IF EXISTS "Block client writes" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all anon access" ON public.activation_codes;

-- Create RESTRICTIVE policies that explicitly deny all access
-- Using RESTRICTIVE ensures these cannot be bypassed by any permissive policy

CREATE POLICY "Deny all SELECT access"
ON public.activation_codes
AS RESTRICTIVE
FOR SELECT
TO authenticated, anon
USING (false);

CREATE POLICY "Deny all INSERT access"
ON public.activation_codes
AS RESTRICTIVE
FOR INSERT
TO authenticated, anon
WITH CHECK (false);

CREATE POLICY "Deny all UPDATE access"
ON public.activation_codes
AS RESTRICTIVE
FOR UPDATE
TO authenticated, anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all DELETE access"
ON public.activation_codes
AS RESTRICTIVE
FOR DELETE
TO authenticated, anon
USING (false);

-- Add a comment documenting why this table is locked down
COMMENT ON TABLE public.activation_codes IS 'Contains encrypted customer payment data. All client access is blocked via RLS. Only accessible via service role in edge functions.';
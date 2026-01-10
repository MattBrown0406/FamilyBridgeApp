-- Fix activation_codes RLS: Replace restrictive "deny all" policies with PERMISSIVE ones
-- (Restrictive policies alone don't block access when no permissive policies exist)

ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

-- Drop existing restrictive policies
DROP POLICY IF EXISTS "Deny all access (anon)" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all access (authenticated)" ON public.activation_codes;

-- Create PERMISSIVE policies that deny all access (these actually block when USING(false))
CREATE POLICY "Block all client access (anon)"
ON public.activation_codes
AS PERMISSIVE
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Block all client access (authenticated)"
ON public.activation_codes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Defense in depth: revoke privileges from client roles
REVOKE ALL ON TABLE public.activation_codes FROM anon;
REVOKE ALL ON TABLE public.activation_codes FROM authenticated;
GRANT ALL ON TABLE public.activation_codes TO service_role;

COMMENT ON TABLE public.activation_codes IS 'Activation codes are managed only by backend functions via service_role. Direct client access is blocked by permissive RLS policies and revoked privileges.';
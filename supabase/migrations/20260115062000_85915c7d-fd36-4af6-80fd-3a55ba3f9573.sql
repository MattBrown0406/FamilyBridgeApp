-- Revoke ALL access from public and anon roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;

-- Only grant to authenticated (who must still pass RLS on base table)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Ensure the view uses security invoker (inherits caller's permissions)
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Double-check RLS is enabled and forced on the base table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

-- Add explicit denial for anon role on base table as extra protection
DROP POLICY IF EXISTS "Block anon access to activation_codes" ON public.activation_codes;
CREATE POLICY "Block anon access to activation_codes"
ON public.activation_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);
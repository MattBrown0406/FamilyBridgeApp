-- Re-apply strict protection on activation_codes (idempotent)
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny all access (anon)" ON public.activation_codes;
DROP POLICY IF EXISTS "Deny all access (authenticated)" ON public.activation_codes;

CREATE POLICY "Deny all access (anon)"
ON public.activation_codes
FOR ALL
TO anon
USING (false)
WITH CHECK (false);

CREATE POLICY "Deny all access (authenticated)"
ON public.activation_codes
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);

-- Defense in depth: ensure client roles have no table privileges
REVOKE ALL ON TABLE public.activation_codes FROM anon;
REVOKE ALL ON TABLE public.activation_codes FROM authenticated;
GRANT ALL ON TABLE public.activation_codes TO service_role;

COMMENT ON TABLE public.activation_codes IS 'Activation codes are managed only by backend functions. Direct client access is denied via RLS + revoked privileges. Sensitive fields (email, Square customer/subscription IDs) are never intended for client access.';
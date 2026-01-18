-- Remove the org admin direct access policy - they should use the RPC function instead
-- which provides masked data and audit logging
DROP POLICY IF EXISTS "Org admins can view masked HIPAA releases" ON public.hipaa_releases;

-- Also clean up the redundant "Users can view their own" policy since it's covered by the super admin policy
DROP POLICY IF EXISTS "Users can view their own HIPAA releases" ON public.hipaa_releases;

-- The remaining policies are:
-- 1. "Only super admins can view full HIPAA releases" - allows self OR super admin (covers user viewing own)
-- 2. "Users can sign their own HIPAA releases" - allows insert

-- Add a comment to document the access pattern
COMMENT ON TABLE public.hipaa_releases IS 'HIPAA release signatures. Direct SELECT access limited to signing user or super admins. Organization admins must use get_hipaa_releases_for_family() RPC which returns masked data with audit logging.';
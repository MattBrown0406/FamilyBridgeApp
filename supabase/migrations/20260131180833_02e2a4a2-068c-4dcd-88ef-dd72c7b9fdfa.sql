-- Secure the hipaa_releases_user_view
-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.hipaa_releases_user_view FROM anon;
REVOKE ALL ON public.hipaa_releases_user_view FROM public;

-- Grant SELECT only to authenticated users (view enforces user_id = auth.uid() filtering)
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.hipaa_releases_user_view IS 
'Secure SECURITY DEFINER view for users to see their own HIPAA releases.
SECURITY: Signature data is masked as ''[SIGNATURE ON FILE]''. Direct table access blocked via RLS.
ACCESS: Restricted to authenticated users. View filters to user''s own releases via WHERE user_id = auth.uid().
PERMISSIONS: Explicit REVOKE from anon/public, GRANT only to authenticated.
COMPLIANCE: HIPAA-compliant access pattern - users can only view their own medical releases.';
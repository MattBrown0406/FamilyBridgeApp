-- Secure HIPAA release views with explicit access controls
-- The views already use WHERE clauses (user_id = auth.uid() and org admin checks)
-- but we need explicit REVOKE/GRANT to prevent any anonymous access

-- Revoke all access from anonymous and public roles
REVOKE ALL ON public.hipaa_releases_user_view FROM anon;
REVOKE ALL ON public.hipaa_releases_user_view FROM public;
REVOKE ALL ON public.hipaa_releases_admin_view FROM anon;
REVOKE ALL ON public.hipaa_releases_admin_view FROM public;

-- Grant SELECT only to authenticated users
-- The WHERE clauses in the views enforce row-level filtering
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;
GRANT SELECT ON public.hipaa_releases_admin_view TO authenticated;

-- Add comments documenting the security model
COMMENT ON VIEW public.hipaa_releases_user_view IS 
'User view of their own HIPAA releases. Access restricted to authenticated users via GRANT. 
Row-level filtering enforced via WHERE user_id = auth.uid(). 
Signature data is masked as [SIGNATURE ON FILE] to protect sensitive information.';

COMMENT ON VIEW public.hipaa_releases_admin_view IS 
'Admin view of HIPAA releases for organization members. Access restricted to authenticated users via GRANT.
Row-level filtering enforced via WHERE clause checking org membership.
Signature data is masked as [SIGNATURE ON FILE] to protect sensitive information.';
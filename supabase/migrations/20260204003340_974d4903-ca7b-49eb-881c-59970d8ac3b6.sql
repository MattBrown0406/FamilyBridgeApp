
-- Secure hipaa_releases_user_view with explicit permissions
-- The view already filters by user_id = auth.uid(), so users only see their own releases
REVOKE ALL ON public.hipaa_releases_user_view FROM anon;
REVOKE ALL ON public.hipaa_releases_user_view FROM public;
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;

-- Secure hipaa_releases_admin_view with explicit permissions  
-- The view already filters by org admin membership
REVOKE ALL ON public.hipaa_releases_admin_view FROM anon;
REVOKE ALL ON public.hipaa_releases_admin_view FROM public;
GRANT SELECT ON public.hipaa_releases_admin_view TO authenticated;

-- Add documentation comments
COMMENT ON VIEW public.hipaa_releases_user_view IS 
'User view for HIPAA releases - users can only see their own releases (WHERE user_id = auth.uid()). 
Signature data is masked as [SIGNATURE ON FILE]. Anonymous access blocked.';

COMMENT ON VIEW public.hipaa_releases_admin_view IS 
'Admin view for HIPAA releases - only org owners/admins can see releases for families in their organization.
Signature data is masked as [SIGNATURE ON FILE]. Anonymous access blocked.';

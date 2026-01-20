-- Fix HIPAA releases views security
-- Issue: hipaa_releases_admin_view is accessible to anon users
-- Solution: Revoke anon access and add security_barrier

-- Recreate hipaa_releases_admin_view with security_barrier
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_barrier = true) AS
SELECT 
    hr.id,
    hr.family_id,
    hr.user_id,
    hr.full_name,
    hr.signed_at,
    hr.release_version,
    '[SIGNATURE ON FILE]'::text AS signature_status,
    hr.created_at
FROM public.hipaa_releases hr
JOIN public.families f ON f.id = hr.family_id
JOIN public.organization_members om ON om.organization_id = f.organization_id
WHERE om.user_id = auth.uid() 
  AND om.role IN ('owner', 'admin')
  AND f.organization_id IS NOT NULL;

-- Restrict to authenticated users only
REVOKE ALL ON public.hipaa_releases_admin_view FROM anon;
REVOKE ALL ON public.hipaa_releases_admin_view FROM public;
GRANT SELECT ON public.hipaa_releases_admin_view TO authenticated;
GRANT SELECT ON public.hipaa_releases_admin_view TO service_role;

-- Recreate hipaa_releases_user_view with security_barrier (already has correct access but add security_barrier)
DROP VIEW IF EXISTS public.hipaa_releases_user_view;

CREATE VIEW public.hipaa_releases_user_view
WITH (security_barrier = true) AS
SELECT 
    id,
    family_id,
    user_id,
    full_name,
    signed_at,
    release_version,
    '[SIGNATURE ON FILE]'::text AS signature_status,
    created_at
FROM public.hipaa_releases
WHERE user_id = auth.uid();

-- Ensure only authenticated users can access
REVOKE ALL ON public.hipaa_releases_user_view FROM anon;
REVOKE ALL ON public.hipaa_releases_user_view FROM public;
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;
GRANT SELECT ON public.hipaa_releases_user_view TO service_role;
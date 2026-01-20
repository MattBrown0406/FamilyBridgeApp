-- Recreate the view as SECURITY DEFINER (the correct pattern for HIPAA data)
-- This allows the view to bypass the base table's RLS (USING false)
-- while enforcing its own access control via WHERE user_id = auth.uid()
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

-- Grant access only to authenticated users
REVOKE ALL ON public.hipaa_releases_user_view FROM anon;
REVOKE ALL ON public.hipaa_releases_user_view FROM public;
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;
-- Enable RLS on the hipaa_releases_user_view
ALTER VIEW public.hipaa_releases_user_view SET (security_invoker = on);

-- Note: Views inherit RLS from underlying tables when security_invoker is on.
-- The underlying hipaa_releases table already has RLS with USING (false) policy,
-- but the view uses SECURITY DEFINER. We need to ensure the view properly restricts access.

-- Drop and recreate the view with security_invoker to enforce RLS
DROP VIEW IF EXISTS public.hipaa_releases_user_view;

CREATE VIEW public.hipaa_releases_user_view
WITH (security_invoker = on) AS
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
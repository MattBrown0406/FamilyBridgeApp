-- Revoke all access from anon and authenticated roles on the HIPAA admin view
REVOKE ALL ON public.hipaa_releases_admin_view FROM anon;
REVOKE ALL ON public.hipaa_releases_admin_view FROM authenticated;

-- Grant SELECT only to authenticated users (RLS will further restrict)
GRANT SELECT ON public.hipaa_releases_admin_view TO authenticated;

-- Drop the view and recreate with security_invoker to respect RLS
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_invoker = on)
AS
SELECT 
    hr.id,
    hr.family_id,
    hr.user_id,
    hr.full_name,
    hr.signed_at,
    hr.release_version,
    hr.created_at,
    -- Mask sensitive data
    CASE 
        WHEN hr.ip_address IS NOT NULL THEN 
            SPLIT_PART(hr.ip_address, '.', 1) || '.xxx.xxx.xxx'
        ELSE NULL 
    END as ip_address_masked,
    CASE 
        WHEN hr.signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL 
    END as signature_status,
    CASE 
        WHEN hr.user_agent IS NOT NULL THEN '[RECORDED]'
        ELSE NULL 
    END as user_agent_status
FROM public.hipaa_releases hr
WHERE public.is_super_admin(auth.uid());

-- Add comment explaining the security
COMMENT ON VIEW public.hipaa_releases_admin_view IS 'Admin-only view of HIPAA releases with masked sensitive data. Only accessible to super admins via is_super_admin() check.';
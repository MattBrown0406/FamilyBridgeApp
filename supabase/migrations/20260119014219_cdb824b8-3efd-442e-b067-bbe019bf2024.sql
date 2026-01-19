-- Drop the existing policy that allows users to view their own raw HIPAA data
DROP POLICY IF EXISTS "Users can view own releases metadata only" ON public.hipaa_releases;

-- Create a new policy that blocks all direct SELECT access (force use of views)
CREATE POLICY "Block direct SELECT - use views instead"
ON public.hipaa_releases
FOR SELECT
USING (false);

-- Add RLS to the user view to ensure it only shows own records
-- Note: The view already has WHERE user_id = auth.uid() so this is already secure
-- But we need to ensure the view uses security_invoker

-- Drop and recreate the user view with security_invoker
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
    created_at,
    CASE 
        WHEN signature_data_encrypted IS NOT NULL THEN '[ENCRYPTED SIGNATURE ON FILE]'
        WHEN signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL
    END AS signature_status
FROM public.hipaa_releases
WHERE user_id = auth.uid();

-- Drop and recreate the admin view with security_invoker  
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_invoker = on) AS
SELECT 
    id,
    family_id,
    user_id,
    full_name,
    signed_at,
    release_version,
    created_at,
    CASE 
        WHEN signature_data_encrypted IS NOT NULL THEN 'encrypted'
        ELSE 'legacy'
    END AS signature_status,
    CASE 
        WHEN ip_address IS NOT NULL THEN regexp_replace(ip_address, '\.\d+$', '.xxx')
        ELSE NULL
    END AS ip_address_masked,
    '[REDACTED]'::text AS user_agent
FROM public.hipaa_releases
WHERE is_super_admin(auth.uid());

-- Now update the base table RLS to allow access from the views
-- Drop the blocking policy we just created
DROP POLICY IF EXISTS "Block direct SELECT - use views instead" ON public.hipaa_releases;

-- Create a policy that allows SELECT only for:
-- 1. Users viewing their own records (for user view)
-- 2. Super admins (for admin view)
CREATE POLICY "SELECT via views only"
ON public.hipaa_releases
FOR SELECT
USING (
    auth.uid() = user_id 
    OR is_super_admin(auth.uid())
);

-- Add comment explaining the security model
COMMENT ON TABLE public.hipaa_releases IS 'HIPAA release records. SECURITY: Direct table access returns limited data via RLS. Use hipaa_releases_user_view for user access (redacted signature) or hipaa_releases_admin_view for admin access (masked IP). Sensitive fields (signature_data, ip_address, user_agent) should only be accessed via views.';
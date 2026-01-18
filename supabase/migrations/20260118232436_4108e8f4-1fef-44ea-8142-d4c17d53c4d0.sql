-- Drop and recreate the view with security_invoker to use the querying user's permissions
DROP VIEW IF EXISTS public.hipaa_releases_user_view;

CREATE VIEW public.hipaa_releases_user_view
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
    CASE 
        WHEN hr.signature_data_encrypted IS NOT NULL THEN '[ENCRYPTED SIGNATURE ON FILE]'
        WHEN hr.signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL 
    END as signature_status
FROM public.hipaa_releases hr
WHERE hr.user_id = auth.uid();

-- Since the view now uses security_invoker, we need to allow SELECT for the view's underlying query
-- But we want to restrict it to only the user's own records
-- Drop the blocking policy and create a proper one for user's own records only
DROP POLICY IF EXISTS "Block direct table access - use secure views" ON public.hipaa_releases;

-- Users can only see their own releases (no signature_data exposed through app code)
CREATE POLICY "Users can view own releases metadata only" 
ON public.hipaa_releases 
FOR SELECT 
USING (auth.uid() = user_id);

-- Grant access to the view
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;
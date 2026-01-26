-- Drop and recreate the hipaa_releases_admin_view with security_invoker=on
-- This ensures the view respects RLS policies of the querying user, not the view owner

DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_invoker=on, security_barrier=true) AS
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

COMMENT ON VIEW public.hipaa_releases_admin_view IS 'Secure view for org admins to view HIPAA releases. Uses security_invoker to enforce RLS, masks signature data, and restricts to org admin roles only.';
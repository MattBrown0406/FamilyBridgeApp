
-- First drop the existing views to recreate with correct columns
DROP VIEW IF EXISTS public.hipaa_releases_user_view;
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

-- Create a secure user view for users to see their own releases (without signature data)
CREATE VIEW public.hipaa_releases_user_view AS
SELECT 
  id,
  family_id,
  user_id,
  full_name,
  signed_at,
  release_version,
  '[SIGNATURE ON FILE]'::text as signature_status,
  created_at
FROM public.hipaa_releases
WHERE user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;

-- Create a secure admin view for org admins (without signature data)
CREATE VIEW public.hipaa_releases_admin_view AS
SELECT 
  hr.id,
  hr.family_id,
  hr.user_id,
  hr.full_name,
  hr.signed_at,
  hr.release_version,
  '[SIGNATURE ON FILE]'::text as signature_status,
  hr.created_at
FROM public.hipaa_releases hr
JOIN public.families f ON f.id = hr.family_id
JOIN public.organization_members om ON om.organization_id = f.organization_id
WHERE om.user_id = auth.uid()
  AND om.role IN ('owner', 'admin')
  AND f.organization_id IS NOT NULL;

-- Grant access to the admin view  
GRANT SELECT ON public.hipaa_releases_admin_view TO authenticated;

-- Add comment explaining the security model
COMMENT ON TABLE public.hipaa_releases IS 'HIPAA medical releases - SECURITY: Direct table access blocked by RLS. Use hipaa_releases_user_view for users viewing their own releases, hipaa_releases_admin_view for org admins, and get_hipaa_signature() function for super admins needing actual signature data.';

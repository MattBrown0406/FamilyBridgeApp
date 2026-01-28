-- The organizations_member_view already properly masks contact info using CASE statements.
-- However, staff members could bypass this by querying the base table directly.
-- We need to ensure the view is the ONLY way to access org data for regular staff.

-- First, check if view has proper security settings
DROP VIEW IF EXISTS public.organizations_member_view;

-- Recreate view with security_invoker and security_barrier to enforce RLS
CREATE VIEW public.organizations_member_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  o.id,
  o.subdomain,
  o.name,
  o.tagline,
  o.logo_url,
  o.favicon_url,
  o.primary_color,
  o.primary_foreground_color,
  o.secondary_color,
  o.accent_color,
  o.background_color,
  o.foreground_color,
  o.heading_font,
  o.body_font,
  o.created_at,
  o.updated_at,
  o.created_by,
  -- Only admins and super admins can see contact info
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.support_email 
    ELSE NULL 
  END AS support_email,
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.phone 
    ELSE NULL 
  END AS phone,
  CASE 
    WHEN public.is_org_admin(o.id, auth.uid()) OR public.is_super_admin(auth.uid()) 
    THEN o.website_url 
    ELSE NULL 
  END AS website_url
FROM public.organizations o
WHERE 
  -- User must be an org member or super admin to see any org data
  public.is_org_member(o.id, auth.uid())
  OR public.is_super_admin(auth.uid());

-- Grant access only to authenticated users on the view
REVOKE ALL ON public.organizations_member_view FROM anon, public;
GRANT SELECT ON public.organizations_member_view TO authenticated;

-- Update base table RLS: Drop the permissive staff SELECT policy
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;

-- Create new policy: Only admins and super admins can SELECT from base table
-- (Regular staff must use the organizations_member_view)
CREATE POLICY "Only org admins can view organization details"
ON public.organizations FOR SELECT
USING (
  public.is_org_admin(id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Add a comment explaining the security pattern
COMMENT ON VIEW public.organizations_member_view IS 
  'Secure view for organization members. Masks support_email, phone, and website_url for non-admin staff. Regular staff MUST use this view as they cannot access the base table directly.';
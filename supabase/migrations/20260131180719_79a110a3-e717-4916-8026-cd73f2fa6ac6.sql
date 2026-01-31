-- Secure the organizations_member_view
-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.organizations_member_view FROM anon;
REVOKE ALL ON public.organizations_member_view FROM public;

-- Grant SELECT only to authenticated users (view's WHERE clause handles org filtering)
GRANT SELECT ON public.organizations_member_view TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.organizations_member_view IS 
'Secure view for organization members to see their organization details.
SECURITY: Contact details (support_email, phone, website) are masked for non-admin users.
ACCESS: Restricted to authenticated users. View filters to user''s own organizations via is_org_member check.
PERMISSIONS: Explicit REVOKE from anon/public, GRANT only to authenticated.';
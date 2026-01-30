-- Harden organizations table RLS - consolidate and add anonymous denial

-- 1. Drop redundant overlapping SELECT policies (they're already covered by org members policy)
DROP POLICY IF EXISTS "Only org admins can view organization details" ON public.organizations;
DROP POLICY IF EXISTS "Super admins can view all organizations" ON public.organizations;

-- 2. Update the org members policy to include super admin access
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;

CREATE POLICY "Authorized users can view organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_org_member(id, auth.uid()) 
  OR public.is_super_admin(auth.uid())
);

-- 3. Explicitly deny anonymous access
DROP POLICY IF EXISTS "Deny anonymous organization access" ON public.organizations;
CREATE POLICY "Deny anonymous organization access"
ON public.organizations
FOR SELECT
TO anon
USING (false);

-- 4. Add comment documenting security model
COMMENT ON TABLE public.organizations IS 
'Treatment provider organizations. SELECT restricted to:
- Organization members (staff who belong to the org)
- Super admins
Anonymous access blocked. Sensitive fields (support_email, phone, website_url) are masked via organizations_member_view for non-admin staff.';
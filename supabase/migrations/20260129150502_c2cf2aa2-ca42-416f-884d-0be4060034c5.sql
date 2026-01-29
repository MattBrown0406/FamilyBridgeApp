
-- Add policy to allow organization members to view their organization
-- This complements the existing admin policies and works with organizations_member_view

-- First, let's add a SELECT policy for regular org members
CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (
  public.is_org_member(id, auth.uid())
);

-- Note: The organizations_member_view already masks sensitive fields (support_email, phone, website_url) 
-- for non-admin members, so this policy enables member access while the view handles data protection.

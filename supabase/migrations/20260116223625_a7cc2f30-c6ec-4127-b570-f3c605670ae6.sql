-- Drop and recreate the SELECT policy to ensure it's properly restrictive
DROP POLICY IF EXISTS "Org members can view their organization" ON public.organizations;

-- Create a proper restrictive SELECT policy
CREATE POLICY "Org members can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_org_member(id, auth.uid()));

-- Also ensure super admins can view all organizations for admin purposes
CREATE POLICY "Super admins can view all organizations"
ON public.organizations
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
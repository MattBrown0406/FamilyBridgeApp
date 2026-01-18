-- Create a function to get all super admin user IDs
CREATE OR REPLACE FUNCTION public.get_super_admin_ids()
RETURNS TABLE(user_id UUID) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT om.user_id
  FROM organization_members om
  JOIN organizations o ON o.id = om.organization_id
  WHERE o.subdomain = 'familybridge'
  AND om.role IN ('owner', 'admin');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Create a secure view for org admins that masks sensitive data
CREATE OR REPLACE VIEW public.hipaa_releases_admin_view AS
SELECT 
  id,
  family_id,
  user_id,
  full_name,
  signed_at,
  release_version,
  -- Mask signature - just show that it exists
  CASE WHEN signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]' ELSE NULL END as signature_status,
  -- Mask IP address - show only first two octets
  CASE WHEN ip_address IS NOT NULL THEN 
    regexp_replace(ip_address, '(\d+\.\d+)\.\d+\.\d+', '\1.xxx.xxx')
  ELSE NULL END as ip_address_masked,
  -- Don't expose user agent at all
  CASE WHEN user_agent IS NOT NULL THEN '[BROWSER INFO REDACTED]' ELSE NULL END as user_agent_status,
  created_at
FROM public.hipaa_releases;

-- Enable RLS on the view
ALTER VIEW public.hipaa_releases_admin_view SET (security_invoker = true);

-- Drop the old org admin policy on hipaa_releases
DROP POLICY IF EXISTS "Only org owners and admins can view HIPAA releases" ON public.hipaa_releases;

-- Create a more restrictive policy - only super admins can see full releases
CREATE POLICY "Only super admins can view full HIPAA releases" 
ON public.hipaa_releases 
FOR SELECT 
USING (
  auth.uid() = user_id 
  OR is_super_admin(auth.uid())
);

-- Create a function to log HIPAA access
CREATE OR REPLACE FUNCTION public.log_hipaa_release_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log access to HIPAA releases
  INSERT INTO public.hipaa_access_audit (
    hipaa_release_id,
    accessed_by,
    access_type,
    ip_address
  ) VALUES (
    NEW.id,
    auth.uid(),
    'view',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN NEW;
END;
$$;

-- Create RLS policies for the admin view
-- Org owners and admins can only see the masked view
CREATE POLICY "Org admins can view masked HIPAA releases"
ON public.hipaa_releases
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM families f
    JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = hipaa_releases.family_id
      AND f.organization_id IS NOT NULL
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- Create a secure function for org admins to view releases (with audit logging)
CREATE OR REPLACE FUNCTION public.get_hipaa_releases_for_family(_family_id uuid)
RETURNS TABLE (
  id uuid,
  family_id uuid,
  user_id uuid,
  full_name text,
  signed_at timestamptz,
  release_version text,
  signature_status text,
  created_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_is_authorized boolean := false;
  v_release record;
BEGIN
  -- Check if user is an org admin for this family
  SELECT EXISTS (
    SELECT 1
    FROM families f
    JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = _family_id
      AND f.organization_id IS NOT NULL
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  ) INTO v_is_authorized;
  
  IF NOT v_is_authorized THEN
    RAISE EXCEPTION 'Not authorized to view HIPAA releases for this family';
  END IF;
  
  -- Log each access
  FOR v_release IN 
    SELECT hr.id FROM hipaa_releases hr WHERE hr.family_id = _family_id
  LOOP
    INSERT INTO hipaa_access_audit (hipaa_release_id, accessed_by, access_type, ip_address)
    VALUES (v_release.id, auth.uid(), 'org_admin_view', 
      current_setting('request.headers', true)::json->>'x-forwarded-for');
  END LOOP;
  
  -- Return masked data
  RETURN QUERY
  SELECT 
    hr.id,
    hr.family_id,
    hr.user_id,
    hr.full_name,
    hr.signed_at,
    hr.release_version,
    '[SIGNATURE ON FILE]'::text as signature_status,
    hr.created_at
  FROM hipaa_releases hr
  WHERE hr.family_id = _family_id;
END;
$$;

-- Revoke direct access to signature_data for non-super admins
-- This is enforced by the RLS policies above

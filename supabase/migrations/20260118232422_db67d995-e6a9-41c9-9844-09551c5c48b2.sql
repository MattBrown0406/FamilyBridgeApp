-- Drop existing SELECT policies on hipaa_releases
DROP POLICY IF EXISTS "Only super admins can view full HIPAA releases" ON public.hipaa_releases;
DROP POLICY IF EXISTS "Users can view own HIPAA releases" ON public.hipaa_releases;

-- Create a strict policy that blocks ALL direct SELECT access
-- Users must use the secure view or RPC function instead
CREATE POLICY "Block direct table access - use secure views" 
ON public.hipaa_releases 
FOR SELECT 
USING (false);

-- Create a secure view for users to see their own releases (without sensitive data)
CREATE OR REPLACE VIEW public.hipaa_releases_user_view AS
SELECT 
    id,
    family_id,
    user_id,
    full_name,
    signed_at,
    release_version,
    created_at,
    -- Never expose raw signature, IP, or user agent
    CASE 
        WHEN signature_data_encrypted IS NOT NULL THEN '[ENCRYPTED SIGNATURE ON FILE]'
        WHEN signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL 
    END as signature_status
FROM public.hipaa_releases
WHERE user_id = auth.uid();

-- Grant access to the view
GRANT SELECT ON public.hipaa_releases_user_view TO authenticated;

-- Update the get_hipaa_releases_for_family function to use masking
CREATE OR REPLACE FUNCTION public.get_hipaa_releases_for_family(_family_id uuid)
RETURNS TABLE(
    id uuid, 
    family_id uuid, 
    user_id uuid, 
    full_name text, 
    signed_at timestamp with time zone, 
    release_version text, 
    signature_status text, 
    created_at timestamp with time zone
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
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
  
  -- Return masked data - NEVER return raw signature_data
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
$function$;

-- Create function for users to check if they have signed
CREATE OR REPLACE FUNCTION public.get_my_hipaa_release(_family_id uuid)
RETURNS TABLE(
    id uuid,
    family_id uuid,
    signed_at timestamp with time zone,
    release_version text,
    signature_status text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  RETURN QUERY
  SELECT 
    hr.id,
    hr.family_id,
    hr.signed_at,
    hr.release_version,
    CASE 
        WHEN hr.signature_data_encrypted IS NOT NULL THEN '[ENCRYPTED SIGNATURE ON FILE]'
        WHEN hr.signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL 
    END::text as signature_status
  FROM hipaa_releases hr
  WHERE hr.family_id = _family_id
    AND hr.user_id = auth.uid();
END;
$function$;

GRANT EXECUTE ON FUNCTION public.get_my_hipaa_release(uuid) TO authenticated;
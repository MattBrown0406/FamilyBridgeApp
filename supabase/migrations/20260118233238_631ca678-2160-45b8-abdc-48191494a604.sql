-- Drop existing function first to allow signature change
DROP FUNCTION IF EXISTS public.get_my_hipaa_release(uuid);

-- Create a secure function for users to check their own HIPAA release status
CREATE OR REPLACE FUNCTION public.get_my_hipaa_release(_family_id uuid)
RETURNS TABLE (
  id uuid,
  family_id uuid,
  full_name text,
  signed_at timestamptz,
  release_version text,
  created_at timestamptz,
  is_signed boolean
)
LANGUAGE sql
STABLE
SECURITY INVOKER
SET search_path = public
AS $$
  SELECT 
    hr.id,
    hr.family_id,
    hr.full_name,
    hr.signed_at,
    hr.release_version,
    hr.created_at,
    true as is_signed
  FROM hipaa_releases hr
  WHERE hr.user_id = auth.uid()
    AND hr.family_id = _family_id
  LIMIT 1;
$$;

-- Update the admin view to also mask sensitive data
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_invoker = on) AS
SELECT 
  id,
  family_id,
  user_id,
  full_name,
  signed_at,
  release_version,
  created_at,
  CASE WHEN signature_data_encrypted IS NOT NULL THEN 'encrypted' ELSE 'legacy' END as signature_status,
  -- Only show partial IP for admin auditing (mask last octet)
  CASE 
    WHEN ip_address IS NOT NULL THEN 
      regexp_replace(ip_address, '\.\d+$', '.xxx')
    ELSE NULL 
  END as ip_address_masked,
  '[REDACTED]' as user_agent
FROM public.hipaa_releases
WHERE is_super_admin(auth.uid());
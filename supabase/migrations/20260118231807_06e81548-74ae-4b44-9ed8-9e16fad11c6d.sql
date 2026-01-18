-- Add encrypted signature column to hipaa_releases
ALTER TABLE public.hipaa_releases 
ADD COLUMN signature_data_encrypted TEXT;

-- Encrypt existing signature data
UPDATE public.hipaa_releases
SET signature_data_encrypted = public.encrypt_sensitive(signature_data)
WHERE signature_data IS NOT NULL AND signature_data_encrypted IS NULL;

-- Create a function to securely decrypt signature for authorized users only
CREATE OR REPLACE FUNCTION public.get_hipaa_signature(_release_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_release RECORD;
  v_decrypted TEXT;
BEGIN
  -- Only super admins can decrypt signatures
  IF NOT public.is_super_admin(auth.uid()) THEN
    RAISE EXCEPTION 'Not authorized to view signature data';
  END IF;
  
  -- Get the release
  SELECT * INTO v_release
  FROM public.hipaa_releases
  WHERE id = _release_id;
  
  IF v_release IS NULL THEN
    RAISE EXCEPTION 'Release not found';
  END IF;
  
  -- Log the access
  INSERT INTO public.hipaa_access_audit (
    hipaa_release_id,
    accessed_by,
    access_type,
    ip_address
  ) VALUES (
    _release_id,
    auth.uid(),
    'signature_decryption',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  -- Return decrypted signature if encrypted version exists, otherwise return legacy data
  IF v_release.signature_data_encrypted IS NOT NULL THEN
    RETURN public.decrypt_sensitive(v_release.signature_data_encrypted);
  ELSE
    RETURN v_release.signature_data;
  END IF;
END;
$function$;

-- Update the admin view to clarify encryption status
DROP VIEW IF EXISTS public.hipaa_releases_admin_view;

CREATE VIEW public.hipaa_releases_admin_view
WITH (security_invoker = on)
AS
SELECT 
    hr.id,
    hr.family_id,
    hr.user_id,
    hr.full_name,
    hr.signed_at,
    hr.release_version,
    hr.created_at,
    CASE 
        WHEN hr.ip_address IS NOT NULL THEN 
            SPLIT_PART(hr.ip_address, '.', 1) || '.xxx.xxx.xxx'
        ELSE NULL 
    END as ip_address_masked,
    CASE 
        WHEN hr.signature_data_encrypted IS NOT NULL THEN '[ENCRYPTED SIGNATURE ON FILE]'
        WHEN hr.signature_data IS NOT NULL THEN '[SIGNATURE ON FILE]'
        ELSE NULL 
    END as signature_status,
    CASE 
        WHEN hr.user_agent IS NOT NULL THEN '[RECORDED]'
        ELSE NULL 
    END as user_agent_status
FROM public.hipaa_releases hr
WHERE public.is_super_admin(auth.uid());

-- Create a secure insert function that encrypts signature before storing
CREATE OR REPLACE FUNCTION public.sign_hipaa_release(
  _family_id uuid,
  _full_name text,
  _signature text,
  _user_agent text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_encrypted_signature TEXT;
  v_release_id UUID;
BEGIN
  -- Encrypt the signature
  v_encrypted_signature := public.encrypt_sensitive(_signature);
  
  -- Insert the release with encrypted signature
  INSERT INTO public.hipaa_releases (
    family_id,
    user_id,
    full_name,
    signature_data,
    signature_data_encrypted,
    user_agent,
    ip_address
  ) VALUES (
    _family_id,
    auth.uid(),
    _full_name,
    '[ENCRYPTED]', -- Placeholder for legacy column
    v_encrypted_signature,
    _user_agent,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  )
  RETURNING id INTO v_release_id;
  
  RETURN v_release_id;
END;
$function$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.sign_hipaa_release(uuid, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_hipaa_signature(uuid) TO authenticated;
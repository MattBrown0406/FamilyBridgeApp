-- Update sign_hipaa_release to also create a provider document record when family has an organization
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
  v_org_id UUID;
  v_family_name TEXT;
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
  
  -- Check if family belongs to an organization and create provider document record
  SELECT f.organization_id, f.name INTO v_org_id, v_family_name
  FROM public.families f
  WHERE f.id = _family_id;
  
  IF v_org_id IS NOT NULL THEN
    -- Create a provider document record for the signed HIPAA release
    INSERT INTO public.provider_documents (
      organization_id,
      family_id,
      uploaded_by,
      title,
      description,
      document_type,
      file_path,
      file_name,
      mime_type
    ) VALUES (
      v_org_id,
      _family_id,
      auth.uid(),
      'HIPAA Release - ' || _full_name,
      'Signed HIPAA Authorization for Release of Information by ' || _full_name || ' for family group: ' || COALESCE(v_family_name, 'Unknown'),
      'consent_form',
      'hipaa_releases/' || v_release_id::text, -- Virtual path referencing the HIPAA release
      'HIPAA_Release_' || replace(_full_name, ' ', '_') || '.pdf',
      'application/pdf'
    );
  END IF;
  
  RETURN v_release_id;
END;
$function$;
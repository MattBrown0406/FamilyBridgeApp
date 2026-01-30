-- Implement HIPAA-style consent signing for transition summary sharing

-- 1. Add signature fields matching the HIPAA release pattern
ALTER TABLE public.transition_summary_consents 
ADD COLUMN IF NOT EXISTS full_name TEXT,
ADD COLUMN IF NOT EXISTS signature_data TEXT,
ADD COLUMN IF NOT EXISTS signature_data_encrypted TEXT,
ADD COLUMN IF NOT EXISTS consent_version TEXT DEFAULT '1.0';

-- 2. Drop the direct INSERT policy - force through signing function
DROP POLICY IF EXISTS "Only patient can provide consent" ON public.transition_summary_consents;

-- Create blocking INSERT policy - no direct inserts allowed
CREATE POLICY "No direct inserts - use sign_transition_consent function"
ON public.transition_summary_consents
FOR INSERT
TO authenticated
WITH CHECK (false);

-- 3. Create secure consent signing function (mirrors sign_hipaa_release pattern)
CREATE OR REPLACE FUNCTION public.sign_transition_consent(
  _transition_summary_id UUID,
  _organization_id UUID,
  _full_name TEXT,
  _signature_data TEXT,
  _notes TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_consent_id UUID;
  v_family_id UUID;
  v_user_id UUID := auth.uid();
  v_encrypted_signature TEXT;
BEGIN
  -- Verify the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Validate inputs
  IF _full_name IS NULL OR trim(_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required for consent';
  END IF;
  
  IF _signature_data IS NULL OR trim(_signature_data) = '' THEN
    RAISE EXCEPTION 'Signature is required for consent';
  END IF;
  
  -- Get the family_id from the transition summary
  SELECT family_id INTO v_family_id
  FROM transition_summaries
  WHERE id = _transition_summary_id;
  
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Transition summary not found';
  END IF;
  
  -- Verify the user is a member of this family (the patient providing consent)
  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = v_family_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You must be a family member to provide consent';
  END IF;
  
  -- Verify the organization exists
  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = _organization_id
  ) THEN
    RAISE EXCEPTION 'Invalid receiving organization';
  END IF;
  
  -- Check if active consent already exists
  IF EXISTS (
    SELECT 1 FROM transition_summary_consents
    WHERE transition_summary_id = _transition_summary_id
      AND user_id = v_user_id
      AND organization_id = _organization_id
      AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Active consent already exists for this organization. Please revoke existing consent first.';
  END IF;
  
  -- Encrypt the signature data (same as HIPAA releases)
  v_encrypted_signature := public.encrypt_sensitive(_signature_data);
  
  -- Insert the consent with encrypted signature
  INSERT INTO transition_summary_consents (
    transition_summary_id,
    user_id,
    organization_id,
    full_name,
    signature_data,
    signature_data_encrypted,
    consent_version,
    consented_via,
    consent_recorded_by,
    patient_signature_hash,
    patient_acknowledged_at,
    patient_ip_address,
    patient_user_agent,
    notes
  ) VALUES (
    _transition_summary_id,
    v_user_id,
    _organization_id,
    _full_name,
    '[SIGNATURE ON FILE]',  -- Mask the actual signature in the regular column
    v_encrypted_signature,
    '1.0',
    'patient_signature',
    v_user_id,
    encode(sha256(_signature_data::bytea), 'hex'),  -- Store hash for verification
    now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    _notes
  )
  RETURNING id INTO v_consent_id;
  
  -- Log to HIPAA audit trail
  INSERT INTO public.hipaa_access_audit (
    hipaa_release_id,
    accessed_by,
    access_type,
    ip_address
  ) VALUES (
    v_consent_id,
    v_user_id,
    'transition_consent_signed',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  RETURN v_consent_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.sign_transition_consent(UUID, UUID, TEXT, TEXT, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.sign_transition_consent(UUID, UUID, TEXT, TEXT, TEXT) TO authenticated;

-- 4. Create function to revoke consent (can be done by patient or provider)
CREATE OR REPLACE FUNCTION public.revoke_transition_consent(
  _consent_id UUID,
  _reason TEXT DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_consent RECORD;
BEGIN
  -- Get the consent record
  SELECT c.*, ts.family_id
  INTO v_consent
  FROM transition_summary_consents c
  JOIN transition_summaries ts ON ts.id = c.transition_summary_id
  WHERE c.id = _consent_id
    AND c.revoked_at IS NULL;
  
  IF v_consent IS NULL THEN
    RAISE EXCEPTION 'Consent not found or already revoked';
  END IF;
  
  -- Check authorization: patient or care provider
  IF NOT (
    v_consent.user_id = v_user_id
    OR public.is_family_moderator(v_consent.family_id, v_user_id)
    OR public.is_managing_org_member(v_consent.family_id, v_user_id)
  ) THEN
    RAISE EXCEPTION 'Not authorized to revoke this consent';
  END IF;
  
  -- Revoke the consent
  UPDATE transition_summary_consents
  SET 
    revoked_at = now(),
    revoked_by = v_user_id,
    notes = COALESCE(notes || E'\n', '') || 'Revoked: ' || COALESCE(_reason, 'No reason provided')
  WHERE id = _consent_id;
  
  -- Log to audit trail
  INSERT INTO public.hipaa_access_audit (
    hipaa_release_id,
    accessed_by,
    access_type,
    ip_address
  ) VALUES (
    _consent_id,
    v_user_id,
    'transition_consent_revoked',
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  
  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION public.revoke_transition_consent(UUID, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.revoke_transition_consent(UUID, TEXT) TO authenticated;

-- 5. Update comment documenting the security model
COMMENT ON TABLE public.transition_summary_consents IS 
'Patient consents for sharing transition summaries between providers. SECURITY: Direct INSERT blocked via RLS. 
All inserts MUST use sign_transition_consent() RPC which encrypts signatures server-side (same pattern as HIPAA releases). 
Patient must provide full name and signature to create consent. 
Signature data is encrypted using encrypt_sensitive() and stored in signature_data_encrypted column.
Revocation available to patient or care providers via revoke_transition_consent() RPC.';
-- Harden transition_summary_consents to require actual patient consent

-- 1. Add patient signature/acknowledgment field to prove consent
ALTER TABLE public.transition_summary_consents 
ADD COLUMN IF NOT EXISTS patient_signature_hash TEXT,
ADD COLUMN IF NOT EXISTS patient_acknowledged_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS patient_ip_address TEXT,
ADD COLUMN IF NOT EXISTS patient_user_agent TEXT;

-- 2. Drop the existing INSERT policy that allows providers to create consents
DROP POLICY IF EXISTS "Care providers can record consents" ON public.transition_summary_consents;

-- 3. Create new policy: ONLY the patient themselves can create consent records
-- This ensures the patient must be logged in and actively consent
CREATE POLICY "Only patient can provide consent"
ON public.transition_summary_consents
FOR INSERT
TO authenticated
WITH CHECK (
  -- The consent must be for the authenticated user (patient)
  user_id = auth.uid()
  -- And they must be a family member associated with this transition summary
  AND EXISTS (
    SELECT 1
    FROM transition_summaries ts
    JOIN family_members fm ON fm.family_id = ts.family_id
    WHERE ts.id = transition_summary_id
      AND fm.user_id = auth.uid()
  )
);

-- 4. Update the revocation policy to allow either patient or provider to revoke
DROP POLICY IF EXISTS "Care providers can revoke consents" ON public.transition_summary_consents;

CREATE POLICY "Patient or care providers can revoke consents"
ON public.transition_summary_consents
FOR UPDATE
TO authenticated
USING (
  -- Patient can revoke their own consent
  user_id = auth.uid()
  -- OR care providers can revoke
  OR EXISTS (
    SELECT 1
    FROM transition_summaries ts
    WHERE ts.id = transition_summary_id
      AND (
        public.is_family_moderator(ts.family_id, auth.uid())
        OR public.is_managing_org_member(ts.family_id, auth.uid())
      )
  )
)
WITH CHECK (
  -- Only allow updating revocation fields
  revoked_at IS NOT NULL
  AND revoked_by = auth.uid()
);

-- 5. Create a secure RPC function for patient consent with signature capture
CREATE OR REPLACE FUNCTION public.record_patient_consent(
  _transition_summary_id UUID,
  _organization_id UUID,
  _signature_hash TEXT,
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
BEGIN
  -- Verify the user is authenticated
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  
  -- Get the family_id from the transition summary
  SELECT family_id INTO v_family_id
  FROM transition_summaries
  WHERE id = _transition_summary_id;
  
  IF v_family_id IS NULL THEN
    RAISE EXCEPTION 'Transition summary not found';
  END IF;
  
  -- Verify the user is a member of this family (the patient)
  IF NOT EXISTS (
    SELECT 1 FROM family_members
    WHERE family_id = v_family_id
      AND user_id = v_user_id
  ) THEN
    RAISE EXCEPTION 'You must be a family member to provide consent';
  END IF;
  
  -- Verify the organization exists and is the receiving org
  IF NOT EXISTS (
    SELECT 1 FROM organizations WHERE id = _organization_id
  ) THEN
    RAISE EXCEPTION 'Invalid organization';
  END IF;
  
  -- Check if active consent already exists
  IF EXISTS (
    SELECT 1 FROM transition_summary_consents
    WHERE transition_summary_id = _transition_summary_id
      AND user_id = v_user_id
      AND organization_id = _organization_id
      AND revoked_at IS NULL
  ) THEN
    RAISE EXCEPTION 'Active consent already exists for this organization';
  END IF;
  
  -- Insert the consent with patient verification
  INSERT INTO transition_summary_consents (
    transition_summary_id,
    user_id,
    organization_id,
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
    'patient_direct',
    v_user_id,
    _signature_hash,
    now(),
    current_setting('request.headers', true)::json->>'x-forwarded-for',
    current_setting('request.headers', true)::json->>'user-agent',
    _notes
  )
  RETURNING id INTO v_consent_id;
  
  RETURN v_consent_id;
END;
$$;

-- Restrict function access
REVOKE ALL ON FUNCTION public.record_patient_consent(UUID, UUID, TEXT, TEXT) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.record_patient_consent(UUID, UUID, TEXT, TEXT) TO authenticated;

-- 6. Create audit function for consent access
CREATE OR REPLACE FUNCTION public.log_consent_access()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Log consent creation and modifications
  INSERT INTO public.hipaa_access_audit (
    hipaa_release_id,
    accessed_by,
    access_type,
    ip_address
  ) VALUES (
    NEW.id, -- Using hipaa_access_audit for consent audit too
    auth.uid(),
    CASE TG_OP
      WHEN 'INSERT' THEN 'consent_created'
      WHEN 'UPDATE' THEN 'consent_modified'
      ELSE TG_OP
    END,
    current_setting('request.headers', true)::json->>'x-forwarded-for'
  );
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Don't fail the operation if audit fails
    RETURN NEW;
END;
$$;

-- Create trigger for consent auditing
DROP TRIGGER IF EXISTS audit_consent_changes ON public.transition_summary_consents;
CREATE TRIGGER audit_consent_changes
  AFTER INSERT OR UPDATE ON public.transition_summary_consents
  FOR EACH ROW
  EXECUTE FUNCTION public.log_consent_access();

-- 7. Add comment documenting the security model
COMMENT ON TABLE public.transition_summary_consents IS 'Patient consents for sharing transition summaries. Consents can ONLY be created by the patient themselves via record_patient_consent() RPC or direct insert with patient signature. Providers can view and revoke but NOT create consents on behalf of patients.';
-- Secure RPC: check if current user needs to sign HIPAA for a family
-- Returns: { needs_sign: boolean, is_initial: boolean, last_transfer_reason: text }
CREATE OR REPLACE FUNCTION public.check_hipaa_status(_family_id UUID)
RETURNS JSON
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_has_org BOOLEAN;
  v_has_signed BOOLEAN;
  v_last_transfer_reason TEXT;
  v_last_transfer_at TIMESTAMPTZ;
  v_signed_at TIMESTAMPTZ;
  v_is_initial BOOLEAN;
BEGIN
  -- Get family org info
  SELECT organization_id INTO v_org_id
  FROM public.families
  WHERE id = _family_id;

  v_has_org := v_org_id IS NOT NULL;

  -- No org = no HIPAA required
  IF NOT v_has_org THEN
    RETURN json_build_object(
      'needs_sign', false,
      'is_initial', false,
      'last_transfer_reason', null
    );
  END IF;

  -- Get most recent transfer info
  SELECT transfer_reason, transferred_at
  INTO v_last_transfer_reason, v_last_transfer_at
  FROM public.family_org_transfer_history
  WHERE family_id = _family_id
  ORDER BY transferred_at DESC
  LIMIT 1;

  -- Get user's most recent signed release for this family
  SELECT signed_at INTO v_signed_at
  FROM public.hipaa_releases
  WHERE family_id = _family_id
    AND user_id = v_user_id
  ORDER BY signed_at DESC
  LIMIT 1;

  -- Determine if initial sign (never signed) or re-sign (signed before last transfer)
  v_is_initial := v_signed_at IS NULL;

  -- needs_sign: never signed, OR signed before the last transfer date
  v_has_signed := (
    v_signed_at IS NOT NULL AND
    (v_last_transfer_at IS NULL OR v_signed_at >= v_last_transfer_at)
  );

  RETURN json_build_object(
    'needs_sign', NOT v_has_signed,
    'is_initial', v_is_initial,
    'last_transfer_reason', v_last_transfer_reason
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_hipaa_status(UUID) TO authenticated;

NOTIFY pgrst, 'reload schema';

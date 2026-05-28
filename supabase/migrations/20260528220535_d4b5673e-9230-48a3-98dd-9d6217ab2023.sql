-- Migration 1: Family Organization Transfer Tracking
-- Track organization transfers on families
-- When a family moves from one provider org to another, we record the history
-- This enables re-signing HIPAA releases on transfer

ALTER TABLE public.families
  ADD COLUMN IF NOT EXISTS previous_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transferred_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS transferred_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_reason TEXT; -- 'aftercare', 'higher_level_of_care', 'lower_level_of_care', 'provider_change', 'relapse', 'other'

-- Create family_org_transfer_history table for full audit trail
CREATE TABLE IF NOT EXISTS public.family_org_transfer_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  to_organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  transfer_reason TEXT NOT NULL DEFAULT 'other',
  transferred_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  transferred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  hipaa_re_sign_required BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- GRANT access for the new table
GRANT SELECT, INSERT ON public.family_org_transfer_history TO authenticated;
GRANT ALL ON public.family_org_transfer_history TO service_role;

ALTER TABLE public.family_org_transfer_history ENABLE ROW LEVEL SECURITY;

-- Org members can view transfer history for their families
CREATE POLICY "Org members can view transfer history"
  ON public.family_org_transfer_history
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.families f
      JOIN public.organization_members om ON om.organization_id = f.organization_id
      WHERE f.id = family_org_transfer_history.family_id
        AND om.user_id = auth.uid()
    )
    OR
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = family_org_transfer_history.family_id
        AND fm.user_id = auth.uid()
    )
  );

-- Only org admins/moderators can insert transfer records
CREATE POLICY "Org admins can insert transfer history"
  ON public.family_org_transfer_history
  FOR INSERT
  WITH CHECK (
    auth.uid() = transferred_by
    AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.user_id = auth.uid()
        AND om.role IN ('admin', 'owner')
    )
  );

CREATE INDEX idx_family_org_transfer_family_id
  ON public.family_org_transfer_history (family_id, transferred_at DESC);

-- Add hipaa_re_sign_required flag to hipaa_releases
-- so we can track which release corresponds to which org tenure
ALTER TABLE public.hipaa_releases
  ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transfer_history_id UUID REFERENCES public.family_org_transfer_history(id) ON DELETE SET NULL;

-- Function to check if a user needs to re-sign HIPAA for current org
CREATE OR REPLACE FUNCTION public.needs_hipaa_re_sign(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT (
    -- Family has an org
    SELECT organization_id IS NOT NULL
    FROM public.families
    WHERE id = _family_id
  )
  AND (
    -- User has NOT signed for the CURRENT org tenure
    -- (i.e., no release exists for this family after the last transfer, or no release at all)
    NOT EXISTS (
      SELECT 1
      FROM public.hipaa_releases hr
      WHERE hr.family_id = _family_id
        AND hr.user_id = _user_id
        AND (
          -- Signed after the most recent transfer
          hr.signed_at >= COALESCE(
            (SELECT MAX(transferred_at)
             FROM public.family_org_transfer_history
             WHERE family_id = _family_id),
            '1970-01-01'::timestamptz
          )
        )
    )
  );
$$;

GRANT EXECUTE ON FUNCTION public.needs_hipaa_re_sign(UUID, UUID) TO authenticated;

-- Migration 2: HIPAA Mandatory Check
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
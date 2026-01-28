-- Create a table to track explicit patient consent for transition summary sharing
CREATE TABLE public.transition_summary_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transition_summary_id UUID NOT NULL REFERENCES public.transition_summaries(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The patient giving consent
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  consented_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  consented_via TEXT NOT NULL DEFAULT 'app', -- 'app', 'verbal', 'written'
  consent_recorded_by UUID NOT NULL, -- Who recorded the consent (staff member)
  revoked_at TIMESTAMP WITH TIME ZONE,
  revoked_by UUID,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(transition_summary_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.transition_summary_consents ENABLE ROW LEVEL SECURITY;

-- Patients can view their own consents
CREATE POLICY "Users can view their own consents"
ON public.transition_summary_consents FOR SELECT
USING (user_id = auth.uid());

-- Family moderators and org members can view consents for their families
CREATE POLICY "Care providers can view consents"
ON public.transition_summary_consents FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.transition_summaries ts
    WHERE ts.id = transition_summary_id
    AND (
      public.is_family_moderator(ts.family_id, auth.uid())
      OR public.is_managing_org_member(ts.family_id, auth.uid())
    )
  )
);

-- Only care providers can record consents (with proper authorization)
CREATE POLICY "Care providers can record consents"
ON public.transition_summary_consents FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.transition_summaries ts
    WHERE ts.id = transition_summary_id
    AND (
      public.is_family_moderator(ts.family_id, auth.uid())
      OR public.is_managing_org_member(ts.family_id, auth.uid())
    )
  )
  AND consent_recorded_by = auth.uid()
);

-- Care providers can update (revoke) consents
CREATE POLICY "Care providers can revoke consents"
ON public.transition_summary_consents FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.transition_summaries ts
    WHERE ts.id = transition_summary_id
    AND (
      public.is_family_moderator(ts.family_id, auth.uid())
      OR public.is_managing_org_member(ts.family_id, auth.uid())
    )
  )
);

-- Update the transition_summaries RLS policy to require explicit consent
-- First drop the old permissive policy for receiving orgs
DROP POLICY IF EXISTS "Receiving org can view shared summaries" ON public.transition_summaries;

-- Create new policy that requires both is_shared_with_next_provider AND explicit consent
CREATE POLICY "Receiving org can view with consent"
ON public.transition_summaries FOR SELECT
USING (
  is_shared_with_next_provider = true
  AND public.is_org_member(to_organization_id, auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.transition_summary_consents tsc
    WHERE tsc.transition_summary_id = id
    AND tsc.organization_id = to_organization_id
    AND tsc.revoked_at IS NULL
  )
);

-- Add index for performance
CREATE INDEX idx_transition_summary_consents_summary 
ON public.transition_summary_consents(transition_summary_id);

CREATE INDEX idx_transition_summary_consents_org 
ON public.transition_summary_consents(organization_id);

-- Add comment explaining the consent requirement
COMMENT ON TABLE public.transition_summary_consents IS 
  'Tracks explicit patient consent for sharing transition summaries with receiving organizations. Required for HIPAA compliance - receiving organizations cannot view summaries without documented patient consent.';
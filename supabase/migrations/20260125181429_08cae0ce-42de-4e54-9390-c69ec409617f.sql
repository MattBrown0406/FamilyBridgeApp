-- Create care phase type enum
CREATE TYPE public.care_phase_type AS ENUM (
  'detox',
  'residential_treatment',
  'partial_hospitalization',
  'intensive_outpatient',
  'outpatient',
  'sober_living',
  'independent'
);

-- Create handoff status enum
CREATE TYPE public.handoff_status AS ENUM (
  'pending',
  'accepted',
  'declined',
  'completed',
  'cancelled'
);

-- Care phases table - tracks current and historical care levels
CREATE TABLE public.care_phases (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  phase_type public.care_phase_type NOT NULL,
  organization_id UUID REFERENCES public.organizations(id),
  started_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  ended_at TIMESTAMP WITH TIME ZONE,
  is_current BOOLEAN NOT NULL DEFAULT true,
  facility_name TEXT,
  notes TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Transition summaries table - structured summaries when moving between phases
CREATE TABLE public.transition_summaries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_phase public.care_phase_type NOT NULL,
  to_phase public.care_phase_type NOT NULL,
  from_organization_id UUID REFERENCES public.organizations(id),
  to_organization_id UUID REFERENCES public.organizations(id),
  
  -- Sobriety snapshot at transition
  sobriety_days_at_transition INTEGER NOT NULL DEFAULT 0,
  total_reset_count INTEGER NOT NULL DEFAULT 0,
  
  -- Structured summary sections
  treatment_progress_summary TEXT,
  strengths_identified TEXT[],
  areas_for_continued_focus TEXT[],
  aftercare_recommendations TEXT[],
  medications_notes TEXT,
  support_system_notes TEXT,
  
  -- Risk and readiness
  risk_factors TEXT[],
  protective_factors TEXT[],
  transition_readiness_score INTEGER CHECK (transition_readiness_score >= 0 AND transition_readiness_score <= 100),
  
  -- Milestones achieved during this phase
  milestones_achieved TEXT[],
  
  -- Metadata
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  is_shared_with_next_provider BOOLEAN NOT NULL DEFAULT false
);

-- Provider handoffs table - manages transfers between provider organizations
CREATE TABLE public.provider_handoffs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  from_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  to_organization_id UUID NOT NULL REFERENCES public.organizations(id),
  transition_summary_id UUID REFERENCES public.transition_summaries(id),
  
  -- Status tracking
  status public.handoff_status NOT NULL DEFAULT 'pending',
  initiated_by UUID NOT NULL,
  initiated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  accepted_by UUID,
  accepted_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  
  -- Sobriety snapshot (visible to receiving provider)
  sobriety_days_at_handoff INTEGER NOT NULL DEFAULT 0,
  
  -- Notes (only visible to relevant providers)
  handoff_notes TEXT,
  receiving_provider_notes TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider sobriety visibility table - allows past providers to track progress without full access
CREATE TABLE public.provider_sobriety_visibility (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  granted_by UUID NOT NULL,
  granted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  can_see_milestones BOOLEAN NOT NULL DEFAULT true,
  can_see_sobriety_days BOOLEAN NOT NULL DEFAULT true,
  notes TEXT,
  UNIQUE(user_id, family_id, organization_id)
);

-- Enable RLS
ALTER TABLE public.care_phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transition_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_handoffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_sobriety_visibility ENABLE ROW LEVEL SECURITY;

-- Helper function: Check if user is in the organization managing this family
CREATE OR REPLACE FUNCTION public.is_managing_org_member(_family_id UUID, _user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families f
    JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = _family_id
      AND om.user_id = _user_id
  )
$$;

-- Helper function: Check if org has visibility rights to a user's sobriety
CREATE OR REPLACE FUNCTION public.has_sobriety_visibility(_user_id UUID, _family_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_sobriety_visibility
    WHERE user_id = _user_id
      AND family_id = _family_id
      AND organization_id = _org_id
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- RLS Policies for care_phases
CREATE POLICY "Family members can view care phases"
  ON public.care_phases FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

CREATE POLICY "Org admins can manage care phases"
  ON public.care_phases FOR ALL
  USING (public.is_managing_org_member(family_id, auth.uid()))
  WITH CHECK (public.is_managing_org_member(family_id, auth.uid()));

CREATE POLICY "Moderators can manage care phases"
  ON public.care_phases FOR ALL
  USING (public.is_family_moderator(family_id, auth.uid()))
  WITH CHECK (public.is_family_moderator(family_id, auth.uid()));

-- RLS Policies for transition_summaries
CREATE POLICY "Family moderators can view transition summaries"
  ON public.transition_summaries FOR SELECT
  USING (public.is_family_moderator(family_id, auth.uid()) OR public.is_managing_org_member(family_id, auth.uid()));

CREATE POLICY "Receiving org can view shared summaries"
  ON public.transition_summaries FOR SELECT
  USING (
    is_shared_with_next_provider = true 
    AND public.is_org_member(to_organization_id, auth.uid())
  );

CREATE POLICY "Org admins can create transition summaries"
  ON public.transition_summaries FOR INSERT
  WITH CHECK (
    public.is_managing_org_member(family_id, auth.uid()) 
    OR public.is_family_moderator(family_id, auth.uid())
  );

CREATE POLICY "Org admins can update transition summaries"
  ON public.transition_summaries FOR UPDATE
  USING (
    public.is_managing_org_member(family_id, auth.uid()) 
    OR public.is_family_moderator(family_id, auth.uid())
  );

-- RLS Policies for provider_handoffs
CREATE POLICY "Involved orgs can view handoffs"
  ON public.provider_handoffs FOR SELECT
  USING (
    public.is_org_member(from_organization_id, auth.uid()) 
    OR public.is_org_member(to_organization_id, auth.uid())
  );

CREATE POLICY "From org can initiate handoffs"
  ON public.provider_handoffs FOR INSERT
  WITH CHECK (
    public.is_org_admin(from_organization_id, auth.uid())
    AND initiated_by = auth.uid()
  );

CREATE POLICY "Involved orgs can update handoffs"
  ON public.provider_handoffs FOR UPDATE
  USING (
    public.is_org_admin(from_organization_id, auth.uid()) 
    OR public.is_org_admin(to_organization_id, auth.uid())
  );

-- RLS Policies for provider_sobriety_visibility
CREATE POLICY "Org members can view their visibility grants"
  ON public.provider_sobriety_visibility FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Managing org can grant visibility"
  ON public.provider_sobriety_visibility FOR INSERT
  WITH CHECK (public.is_managing_org_member(family_id, auth.uid()));

CREATE POLICY "Managing org can revoke visibility"
  ON public.provider_sobriety_visibility FOR DELETE
  USING (public.is_managing_org_member(family_id, auth.uid()));

-- Create indexes for performance
CREATE INDEX idx_care_phases_user_family ON public.care_phases(user_id, family_id);
CREATE INDEX idx_care_phases_current ON public.care_phases(family_id, is_current) WHERE is_current = true;
CREATE INDEX idx_transition_summaries_user ON public.transition_summaries(user_id, family_id);
CREATE INDEX idx_provider_handoffs_orgs ON public.provider_handoffs(from_organization_id, to_organization_id);
CREATE INDEX idx_provider_handoffs_status ON public.provider_handoffs(status) WHERE status = 'pending';
CREATE INDEX idx_sobriety_visibility_org ON public.provider_sobriety_visibility(organization_id, user_id);
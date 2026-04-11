
-- Accountability Commitments
CREATE TABLE public.accountability_commitments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  commitment_type TEXT NOT NULL DEFAULT 'family' CHECK (commitment_type IN ('family', 'provider')),
  title TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'adhered', 'partial', 'broken')),
  due_date TIMESTAMPTZ,
  created_by UUID NOT NULL,
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID,
  review_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accountability_commitments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view their family commitments"
  ON public.accountability_commitments FOR SELECT
  USING (
    family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_commitments.family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view org commitments"
  ON public.accountability_commitments FOR SELECT
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_commitments.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Admins and moderators can manage family commitments"
  ON public.accountability_commitments FOR INSERT
  WITH CHECK (
    family_id IS NOT NULL AND (
      public.is_family_admin_or_moderator(family_id, auth.uid())
    )
  );

CREATE POLICY "Admins and moderators can update family commitments"
  ON public.accountability_commitments FOR UPDATE
  USING (
    (family_id IS NOT NULL AND public.is_family_admin_or_moderator(family_id, auth.uid()))
    OR (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_commitments.organization_id AND om.user_id = auth.uid()
    ))
  );

CREATE POLICY "Org members can insert provider commitments"
  ON public.accountability_commitments FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_commitments.organization_id AND om.user_id = auth.uid()
    )
  );

-- Accountability Scores
CREATE TABLE public.accountability_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  score_type TEXT NOT NULL CHECK (score_type IN ('family', 'provider', 'system')),
  score INTEGER NOT NULL DEFAULT 0 CHECK (score >= 0 AND score <= 100),
  previous_score INTEGER CHECK (previous_score >= 0 AND previous_score <= 100),
  trend TEXT NOT NULL DEFAULT 'stable' CHECK (trend IN ('improving', 'declining', 'unstable', 'stable')),
  factors JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_insight TEXT,
  positive_feedback TEXT[],
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accountability_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view family scores"
  ON public.accountability_scores FOR SELECT
  USING (
    family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_scores.family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view org scores"
  ON public.accountability_scores FOR SELECT
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_scores.organization_id AND om.user_id = auth.uid()
    )
  );

-- Accountability Alerts
CREATE TABLE public.accountability_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'critical')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  source_type TEXT NOT NULL DEFAULT 'family' CHECK (source_type IN ('family', 'provider', 'system')),
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accountability_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view family alerts"
  ON public.accountability_alerts FOR SELECT
  USING (
    family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_alerts.family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view org alerts"
  ON public.accountability_alerts FOR SELECT
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_alerts.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Family admins can dismiss family alerts"
  ON public.accountability_alerts FOR UPDATE
  USING (
    family_id IS NOT NULL AND public.is_family_admin_or_moderator(family_id, auth.uid())
  );

CREATE POLICY "Org members can dismiss org alerts"
  ON public.accountability_alerts FOR UPDATE
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_alerts.organization_id AND om.user_id = auth.uid()
    )
  );

-- Accountability Contracts
CREATE TABLE public.accountability_contracts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  contract_type TEXT NOT NULL DEFAULT 'family' CHECK (contract_type IN ('family', 'provider')),
  title TEXT NOT NULL,
  terms JSONB NOT NULL DEFAULT '[]'::jsonb,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('draft', 'active', 'completed', 'violated', 'expired')),
  created_by UUID NOT NULL,
  acknowledged_by UUID[] DEFAULT '{}',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.accountability_contracts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view family contracts"
  ON public.accountability_contracts FOR SELECT
  USING (
    family_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.family_members fm WHERE fm.family_id = accountability_contracts.family_id AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view org contracts"
  ON public.accountability_contracts FOR SELECT
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_contracts.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Family admins can manage family contracts"
  ON public.accountability_contracts FOR INSERT
  WITH CHECK (
    family_id IS NOT NULL AND public.is_family_admin_or_moderator(family_id, auth.uid())
  );

CREATE POLICY "Family admins can update family contracts"
  ON public.accountability_contracts FOR UPDATE
  USING (
    family_id IS NOT NULL AND public.is_family_admin_or_moderator(family_id, auth.uid())
  );

CREATE POLICY "Org members can manage provider contracts"
  ON public.accountability_contracts FOR INSERT
  WITH CHECK (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_contracts.organization_id AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can update provider contracts"
  ON public.accountability_contracts FOR UPDATE
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om WHERE om.organization_id = accountability_contracts.organization_id AND om.user_id = auth.uid()
    )
  );

-- Indexes
CREATE INDEX idx_accountability_commitments_family ON public.accountability_commitments(family_id);
CREATE INDEX idx_accountability_commitments_org ON public.accountability_commitments(organization_id);
CREATE INDEX idx_accountability_scores_family ON public.accountability_scores(family_id, score_type, calculated_at DESC);
CREATE INDEX idx_accountability_scores_org ON public.accountability_scores(organization_id, score_type, calculated_at DESC);
CREATE INDEX idx_accountability_alerts_family ON public.accountability_alerts(family_id, is_dismissed);
CREATE INDEX idx_accountability_alerts_org ON public.accountability_alerts(organization_id, is_dismissed);
CREATE INDEX idx_accountability_contracts_family ON public.accountability_contracts(family_id, status);

-- Triggers for updated_at
CREATE TRIGGER update_accountability_commitments_updated_at
  BEFORE UPDATE ON public.accountability_commitments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_accountability_contracts_updated_at
  BEFORE UPDATE ON public.accountability_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

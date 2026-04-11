-- ============================================================================
-- FIIS Learning Phase 1
-- Captures coaching outcomes, learning snapshots, and governed adaptation proposals
-- ============================================================================

CREATE TABLE public.fiis_coaching_outcomes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  session_id UUID REFERENCES public.coaching_sessions(id) ON DELETE CASCADE,
  analysis_id UUID REFERENCES public.fiis_pattern_analyses(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  outcome_status TEXT NOT NULL CHECK (outcome_status IN ('helpful', 'mixed', 'unhelpful', 'escalated', 'stabilized', 'unknown')),
  deescalated BOOLEAN,
  boundary_held BOOLEAN,
  relapse_signal_confirmed BOOLEAN,
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_coaching_outcomes ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fiis_coaching_outcomes_family_created
  ON public.fiis_coaching_outcomes(family_id, created_at DESC);
CREATE INDEX idx_fiis_coaching_outcomes_session
  ON public.fiis_coaching_outcomes(session_id);
CREATE INDEX idx_fiis_coaching_outcomes_analysis
  ON public.fiis_coaching_outcomes(analysis_id);

CREATE POLICY "Family and moderators can view FIIS coaching outcomes"
ON public.fiis_coaching_outcomes
FOR SELECT
USING (
  public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Family and moderators can create FIIS coaching outcomes"
ON public.fiis_coaching_outcomes
FOR INSERT
WITH CHECK (
  created_by = auth.uid()
  AND (
    public.is_family_member(family_id, auth.uid())
    OR public.is_family_moderator_or_org_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  )
);

CREATE POLICY "Authors and moderators can update FIIS coaching outcomes"
ON public.fiis_coaching_outcomes
FOR UPDATE
USING (
  created_by = auth.uid()
  OR public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE TRIGGER update_fiis_coaching_outcomes_updated_at
BEFORE UPDATE ON public.fiis_coaching_outcomes
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================

CREATE TABLE public.fiis_learning_snapshots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  window_days INTEGER NOT NULL DEFAULT 90,
  coaching_sessions_count INTEGER NOT NULL DEFAULT 0,
  feedback_count INTEGER NOT NULL DEFAULT 0,
  outcome_count INTEGER NOT NULL DEFAULT 0,
  false_positive_rate NUMERIC(5,2),
  false_negative_rate NUMERIC(5,2),
  helpful_rate NUMERIC(5,2),
  stabilization_rate NUMERIC(5,2),
  boundary_hold_rate NUMERIC(5,2),
  learning_confidence TEXT NOT NULL DEFAULT 'low' CHECK (learning_confidence IN ('low', 'moderate', 'high')),
  proposal_count INTEGER NOT NULL DEFAULT 0,
  active_adaptations JSONB NOT NULL DEFAULT '[]'::jsonb,
  evidence_summary TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  metrics JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_learning_snapshots ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fiis_learning_snapshots_family_created
  ON public.fiis_learning_snapshots(family_id, created_at DESC);

CREATE POLICY "Family and moderators can view FIIS learning snapshots"
ON public.fiis_learning_snapshots
FOR SELECT
USING (
  public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

-- ============================================================================

CREATE TABLE public.fiis_adaptation_proposals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'family' CHECK (scope IN ('family', 'organization', 'global')),
  engine TEXT NOT NULL DEFAULT 'fiis',
  proposal_type TEXT NOT NULL CHECK (proposal_type IN (
    'sensitivity_adjustment',
    'recommendation_priority',
    'tone_bias',
    'pattern_emphasis',
    'context_weight'
  )),
  parameter_key TEXT NOT NULL,
  current_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  proposed_value JSONB NOT NULL DEFAULT '{}'::jsonb,
  evidence JSONB NOT NULL DEFAULT '{}'::jsonb,
  rationale TEXT NOT NULL,
  confidence TEXT NOT NULL DEFAULT 'low' CHECK (confidence IN ('low', 'moderate', 'high')),
  change_magnitude_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
  sample_size INTEGER NOT NULL DEFAULT 0,
  auto_apply_eligible BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'auto_applied', 'approved', 'rejected', 'rolled_back', 'suppressed')),
  created_by TEXT NOT NULL DEFAULT 'system',
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  rollback_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_adaptation_proposals ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fiis_adaptation_proposals_family_status_created
  ON public.fiis_adaptation_proposals(family_id, status, created_at DESC);
CREATE INDEX idx_fiis_adaptation_proposals_parameter
  ON public.fiis_adaptation_proposals(parameter_key, created_at DESC);

CREATE POLICY "Family and moderators can view FIIS adaptation proposals"
ON public.fiis_adaptation_proposals
FOR SELECT
USING (
  public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators can create FIIS adaptation proposals"
ON public.fiis_adaptation_proposals
FOR INSERT
WITH CHECK (
  public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators can update FIIS adaptation proposals"
ON public.fiis_adaptation_proposals
FOR UPDATE
USING (
  public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE TRIGGER update_fiis_adaptation_proposals_updated_at
BEFORE UPDATE ON public.fiis_adaptation_proposals
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================================

CREATE TABLE public.fiis_adaptation_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  proposal_id UUID REFERENCES public.fiis_adaptation_proposals(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN (
    'proposal_created',
    'auto_applied',
    'approved',
    'rejected',
    'rolled_back',
    'suppressed',
    'recalculated'
  )),
  actor_type TEXT NOT NULL DEFAULT 'system' CHECK (actor_type IN ('system', 'user', 'admin')),
  actor_id UUID,
  detail TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_adaptation_audit_log ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fiis_adaptation_audit_family_created
  ON public.fiis_adaptation_audit_log(family_id, created_at DESC);

CREATE POLICY "Family and moderators can view FIIS adaptation audit log"
ON public.fiis_adaptation_audit_log
FOR SELECT
USING (
  public.is_family_member(family_id, auth.uid())
  OR public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators can create FIIS adaptation audit log entries"
ON public.fiis_adaptation_audit_log
FOR INSERT
WITH CHECK (
  public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

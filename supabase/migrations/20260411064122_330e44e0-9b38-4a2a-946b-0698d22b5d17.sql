-- Input Reconciliation Issues
CREATE TABLE public.input_reconciliation_issues (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  issue_type TEXT NOT NULL CHECK (issue_type IN ('shallow', 'incomplete', 'contradiction')),
  category TEXT NOT NULL,
  summary TEXT NOT NULL,
  prior_input TEXT,
  current_input TEXT,
  required_info TEXT[] NOT NULL DEFAULT '{}',
  escalation_level INTEGER NOT NULL DEFAULT 1 CHECK (escalation_level BETWEEN 1 AND 3),
  tracking_state TEXT NOT NULL DEFAULT 'shallow_input' CHECK (tracking_state IN ('shallow_input', 'incomplete_input', 'unresolved_contradiction', 'partial_clarification', 'resolved')),
  family_member_name TEXT,
  detected_by TEXT DEFAULT 'system',
  resolved_at TIMESTAMPTZ,
  deferred_until TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_reconciliation_issues ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all issues"
  ON public.input_reconciliation_issues FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org members can view their org issues"
  ON public.input_reconciliation_issues FOR SELECT
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Family admins can view their family issues"
  ON public.input_reconciliation_issues FOR SELECT
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()));

CREATE POLICY "System can insert issues"
  ON public.input_reconciliation_issues FOR INSERT
  WITH CHECK (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Authorized users can update issues"
  ON public.input_reconciliation_issues FOR UPDATE
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE TRIGGER update_input_issues_updated_at
  BEFORE UPDATE ON public.input_reconciliation_issues
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Input Data Confidence Scores
CREATE TABLE public.input_data_confidence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  category TEXT NOT NULL,
  confidence_level TEXT NOT NULL DEFAULT 'low' CHECK (confidence_level IN ('low', 'moderate', 'high')),
  completeness INTEGER NOT NULL DEFAULT 0 CHECK (completeness BETWEEN 0 AND 100),
  consistency INTEGER NOT NULL DEFAULT 0 CHECK (consistency BETWEEN 0 AND 100),
  specificity INTEGER NOT NULL DEFAULT 0 CHECK (specificity BETWEEN 0 AND 100),
  overall_score INTEGER NOT NULL DEFAULT 0 CHECK (overall_score BETWEEN 0 AND 100),
  issues_list TEXT[] NOT NULL DEFAULT '{}',
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_data_confidence ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all confidence"
  ON public.input_data_confidence FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org members can view their org confidence"
  ON public.input_data_confidence FOR SELECT
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Family admins can view their family confidence"
  ON public.input_data_confidence FOR SELECT
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()));

CREATE POLICY "Authorized insert on confidence"
  ON public.input_data_confidence FOR INSERT
  WITH CHECK (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE POLICY "Authorized update on confidence"
  ON public.input_data_confidence FOR UPDATE
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

CREATE TRIGGER update_input_confidence_updated_at
  BEFORE UPDATE ON public.input_data_confidence
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Input Deferrals
CREATE TABLE public.input_deferrals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  issue_id UUID NOT NULL REFERENCES public.input_reconciliation_issues(id) ON DELETE CASCADE,
  deferred_by UUID NOT NULL,
  family_member_name TEXT,
  return_time TIMESTAMPTZ NOT NULL,
  reminder_sent BOOLEAN NOT NULL DEFAULT false,
  reminder_sent_at TIMESTAMPTZ,
  returned_at TIMESTAMPTZ,
  resolved BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_deferrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all deferrals"
  ON public.input_deferrals FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Family admins can view their family deferrals"
  ON public.input_deferrals FOR SELECT
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()));

CREATE POLICY "Authorized insert on deferrals"
  ON public.input_deferrals FOR INSERT
  WITH CHECK (auth.uid() = deferred_by);

CREATE POLICY "Authorized update on deferrals"
  ON public.input_deferrals FOR UPDATE
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- Input Reconciliation Events (Audit Log)
CREATE TABLE public.input_reconciliation_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('detection', 'prompt', 'clarification', 'deferral', 'resolution', 'escalation', 'reminder')),
  description TEXT NOT NULL,
  family_member_name TEXT,
  category TEXT NOT NULL,
  confidence_level TEXT CHECK (confidence_level IN ('low', 'moderate', 'high')),
  related_issue_id UUID REFERENCES public.input_reconciliation_issues(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.input_reconciliation_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Super admins can view all events"
  ON public.input_reconciliation_events FOR SELECT
  USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Org members can view their org events"
  ON public.input_reconciliation_events FOR SELECT
  USING (organization_id IS NOT NULL AND public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Family admins can view their family events"
  ON public.input_reconciliation_events FOR SELECT
  USING (public.is_family_admin_or_moderator(family_id, auth.uid()));

CREATE POLICY "Authorized insert on events"
  ON public.input_reconciliation_events FOR INSERT
  WITH CHECK (public.is_family_admin_or_moderator(family_id, auth.uid()) OR public.is_super_admin(auth.uid()));

-- Indexes for performance
CREATE INDEX idx_input_issues_family ON public.input_reconciliation_issues(family_id);
CREATE INDEX idx_input_issues_org ON public.input_reconciliation_issues(organization_id);
CREATE INDEX idx_input_issues_state ON public.input_reconciliation_issues(tracking_state);
CREATE INDEX idx_input_confidence_family ON public.input_data_confidence(family_id);
CREATE INDEX idx_input_confidence_org ON public.input_data_confidence(organization_id);
CREATE INDEX idx_input_deferrals_family ON public.input_deferrals(family_id);
CREATE INDEX idx_input_deferrals_overdue ON public.input_deferrals(return_time) WHERE resolved = false;
CREATE INDEX idx_input_events_family ON public.input_reconciliation_events(family_id);
CREATE INDEX idx_input_events_org ON public.input_reconciliation_events(organization_id);
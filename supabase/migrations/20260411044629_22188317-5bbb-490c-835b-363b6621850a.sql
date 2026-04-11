
-- Create outcome_predictions table
CREATE TABLE public.outcome_predictions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  probability NUMERIC(5,2) NOT NULL DEFAULT 0,
  previous_probability NUMERIC(5,2),
  trend TEXT NOT NULL DEFAULT 'stable',
  confidence TEXT NOT NULL DEFAULT 'low',
  risk_drivers JSONB DEFAULT '[]'::jsonb,
  protective_factors JSONB DEFAULT '[]'::jsonb,
  ai_insight TEXT,
  ai_recommendation JSONB,
  data_sources JSONB DEFAULT '{}'::jsonb,
  calculated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outcome_predictions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_outcome_predictions_family ON public.outcome_predictions(family_id);
CREATE INDEX idx_outcome_predictions_type ON public.outcome_predictions(prediction_type);
CREATE INDEX idx_outcome_predictions_calculated ON public.outcome_predictions(calculated_at DESC);

CREATE POLICY "Family members can view predictions"
  ON public.outcome_predictions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = outcome_predictions.family_id
        AND fm.user_id = auth.uid()
        AND fm.role != 'recovering'
    )
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_professional_moderator(family_id, auth.uid())
  );

CREATE POLICY "System can insert predictions"
  ON public.outcome_predictions FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

-- Create outcome_prediction_alerts table
CREATE TABLE public.outcome_prediction_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  prediction_type TEXT NOT NULL,
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  dismissed_by UUID,
  dismissed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.outcome_prediction_alerts ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_prediction_alerts_family ON public.outcome_prediction_alerts(family_id);

CREATE POLICY "Family members can view prediction alerts"
  ON public.outcome_prediction_alerts FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = outcome_prediction_alerts.family_id
        AND fm.user_id = auth.uid()
        AND fm.role != 'recovering'
    )
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Family members can dismiss prediction alerts"
  ON public.outcome_prediction_alerts FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = outcome_prediction_alerts.family_id
        AND fm.user_id = auth.uid()
        AND fm.role != 'recovering'
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = outcome_prediction_alerts.family_id
        AND fm.user_id = auth.uid()
        AND fm.role != 'recovering'
    )
  );

CREATE POLICY "System can insert prediction alerts"
  ON public.outcome_prediction_alerts FOR INSERT
  TO authenticated
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

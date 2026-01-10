-- FIIS: Family Intervention Intelligence System tables

-- Main observations table for manual family entries
CREATE TABLE public.fiis_observations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  observation_type TEXT NOT NULL CHECK (observation_type IN ('behavior', 'conversation', 'decision', 'boundary', 'consequence', 'emotional_climate', 'calm_period', 'concern')),
  content TEXT NOT NULL,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-logged events from other parts of the system
CREATE TABLE public.fiis_auto_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL CHECK (event_type IN ('checkin', 'checkout', 'missed_checkout', 'financial_request', 'financial_approved', 'financial_denied', 'message_filtered', 'boundary_proposed', 'boundary_approved', 'location_request', 'location_shared')),
  event_data JSONB DEFAULT '{}',
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- AI pattern analysis results (cached to reduce API calls)
CREATE TABLE public.fiis_pattern_analyses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  analysis_type TEXT NOT NULL DEFAULT 'full' CHECK (analysis_type IN ('full', 'quick', 'specific')),
  input_summary JSONB NOT NULL DEFAULT '{}',
  pattern_signals JSONB NOT NULL DEFAULT '[]',
  what_seeing TEXT,
  contextual_framing TEXT,
  clarifying_questions JSONB DEFAULT '[]',
  what_to_watch JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all FIIS tables
ALTER TABLE public.fiis_observations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiis_auto_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiis_pattern_analyses ENABLE ROW LEVEL SECURITY;

-- RLS Policies for fiis_observations (family members can read/write for their family)
CREATE POLICY "Family members can view observations"
ON public.fiis_observations
FOR SELECT
USING (is_family_member(family_id, auth.uid()));

CREATE POLICY "Family members can create observations"
ON public.fiis_observations
FOR INSERT
WITH CHECK (is_family_member(family_id, auth.uid()) AND auth.uid() = user_id);

CREATE POLICY "Users can delete their own observations"
ON public.fiis_observations
FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for fiis_auto_events
CREATE POLICY "Family members can view auto events"
ON public.fiis_auto_events
FOR SELECT
USING (is_family_member(family_id, auth.uid()));

CREATE POLICY "Service role can insert auto events"
ON public.fiis_auto_events
FOR INSERT
WITH CHECK (true);

-- RLS Policies for fiis_pattern_analyses
CREATE POLICY "Family members can view pattern analyses"
ON public.fiis_pattern_analyses
FOR SELECT
USING (is_family_member(family_id, auth.uid()));

CREATE POLICY "Family members can create pattern analyses"
ON public.fiis_pattern_analyses
FOR INSERT
WITH CHECK (is_family_member(family_id, auth.uid()) AND auth.uid() = requested_by);

-- Indexes for performance
CREATE INDEX idx_fiis_observations_family ON public.fiis_observations(family_id, occurred_at DESC);
CREATE INDEX idx_fiis_auto_events_family ON public.fiis_auto_events(family_id, occurred_at DESC);
CREATE INDEX idx_fiis_pattern_analyses_family ON public.fiis_pattern_analyses(family_id, created_at DESC);

-- Enable realtime for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.fiis_observations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fiis_auto_events;

COMMENT ON TABLE public.fiis_observations IS 'Manual family observations for FIIS pattern detection';
COMMENT ON TABLE public.fiis_auto_events IS 'Auto-logged events from check-ins, financial requests, etc.';
COMMENT ON TABLE public.fiis_pattern_analyses IS 'Cached AI pattern analysis results';
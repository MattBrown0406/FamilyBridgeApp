-- Durable moderator-side FIIS telemetry so learning can include professional-support interactions

CREATE TABLE public.fiis_moderator_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  ai_model TEXT,
  runtime_confidence TEXT CHECK (runtime_confidence IN ('low', 'moderate', 'high')),
  runtime_adaptations JSONB NOT NULL DEFAULT '[]'::jsonb,
  runtime_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
  escalation_level INTEGER CHECK (escalation_level BETWEEN 1 AND 4),
  guidance_style TEXT,
  prompt_summary TEXT,
  response_summary TEXT,
  chat_turn_count INTEGER NOT NULL DEFAULT 0,
  response_latency_ms INTEGER,
  tokens_in INTEGER,
  tokens_out INTEGER,
  telemetry JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fiis_moderator_sessions ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_fiis_moderator_sessions_family_created
  ON public.fiis_moderator_sessions(family_id, created_at DESC);

CREATE POLICY "Moderators and org members can view moderator FIIS telemetry"
ON public.fiis_moderator_sessions
FOR SELECT
USING (
  public.is_family_moderator_or_org_member(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
);

CREATE POLICY "Moderators and org members can create moderator FIIS telemetry"
ON public.fiis_moderator_sessions
FOR INSERT
WITH CHECK (
  moderator_id = auth.uid()
  AND (
    public.is_family_moderator_or_org_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  )
);

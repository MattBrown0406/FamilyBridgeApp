-- Strengthen FIIS telemetry so coaching/runtime behavior leaves durable learning evidence

ALTER TABLE public.coaching_sessions
ADD COLUMN IF NOT EXISTS ai_model TEXT,
ADD COLUMN IF NOT EXISTS runtime_confidence TEXT CHECK (runtime_confidence IN ('low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS runtime_adaptations JSONB NOT NULL DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS runtime_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS ai_summary TEXT,
ADD COLUMN IF NOT EXISTS guidance_style TEXT,
ADD COLUMN IF NOT EXISTS escalation_level INTEGER CHECK (escalation_level BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS telemetry JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_coaching_sessions_family_started
  ON public.coaching_sessions(family_id, started_at DESC);

ALTER TABLE public.fiis_coaching_outcomes
ADD COLUMN IF NOT EXISTS coaching_session_type TEXT,
ADD COLUMN IF NOT EXISTS runtime_confidence TEXT CHECK (runtime_confidence IN ('low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS guidance_style TEXT,
ADD COLUMN IF NOT EXISTS escalation_level INTEGER CHECK (escalation_level BETWEEN 1 AND 4),
ADD COLUMN IF NOT EXISTS response_latency_ms INTEGER,
ADD COLUMN IF NOT EXISTS tokens_in INTEGER,
ADD COLUMN IF NOT EXISTS tokens_out INTEGER,
ADD COLUMN IF NOT EXISTS runtime_flags JSONB NOT NULL DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS adaptation_snapshot JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE INDEX IF NOT EXISTS idx_fiis_coaching_outcomes_family_created_type
  ON public.fiis_coaching_outcomes(family_id, coaching_session_type, created_at DESC);

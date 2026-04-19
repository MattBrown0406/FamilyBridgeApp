-- Expand family engagement outcomes from simple activity proxies to structured
-- support engagement + communication quality signals.

CREATE TABLE IF NOT EXISTS public.family_engagement_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  recovering_user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  participant_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  care_phase_id UUID REFERENCES public.care_phases(id) ON DELETE SET NULL,
  source_table TEXT,
  source_record_id UUID,
  event_type TEXT NOT NULL,
  engagement_domain TEXT NOT NULL,
  meeting_type public.meeting_type,
  support_category TEXT,
  valence TEXT NOT NULL DEFAULT 'supportive' CHECK (valence IN ('supportive', 'neutral', 'mixed', 'negative')),
  intensity INTEGER NOT NULL DEFAULT 1 CHECK (intensity >= 1 AND intensity <= 5),
  confidence NUMERIC(4,3),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (source_table, source_record_id, event_type)
);

ALTER TABLE public.family_engagement_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view family engagement events"
  ON public.family_engagement_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = family_engagement_events.family_id
      AND fm.user_id = auth.uid()
    )
  );

CREATE POLICY "Org members can view org family engagement events"
  ON public.family_engagement_events FOR SELECT
  USING (
    organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = family_engagement_events.organization_id
      AND om.user_id = auth.uid()
    )
  );

CREATE POLICY "System and moderators can insert family engagement events"
  ON public.family_engagement_events FOR INSERT
  WITH CHECK (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = family_engagement_events.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE POLICY "System and moderators can update family engagement events"
  ON public.family_engagement_events FOR UPDATE
  USING (
    public.is_family_admin_or_moderator(family_id, auth.uid())
    OR (
      organization_id IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.organization_members om
        WHERE om.organization_id = family_engagement_events.organization_id
        AND om.user_id = auth.uid()
      )
    )
  );

CREATE INDEX IF NOT EXISTS idx_family_engagement_events_family_time
  ON public.family_engagement_events(family_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_engagement_events_recovering_time
  ON public.family_engagement_events(recovering_user_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_engagement_events_org_time
  ON public.family_engagement_events(organization_id, occurred_at DESC);
CREATE INDEX IF NOT EXISTS idx_family_engagement_events_domain
  ON public.family_engagement_events(engagement_domain, event_type, occurred_at DESC);

CREATE TRIGGER update_family_engagement_events_updated_at
  BEFORE UPDATE ON public.family_engagement_events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE FUNCTION public.map_meeting_type_to_support_category(meeting meeting_type)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
BEGIN
  CASE meeting
    WHEN 'Al-Anon', 'Nar-Anon', 'ACA', 'CoDA', 'Families Anonymous' THEN
      RETURN 'family_recovery_fellowship';
    WHEN 'Smart Recovery', 'Refuge Recovery', 'Celebrate Recovery', 'AA', 'NA' THEN
      RETURN 'general_recovery_support';
    WHEN 'Therapy' THEN
      RETURN 'family_therapy';
    WHEN 'Support Group' THEN
      RETURN 'family_support_group';
    WHEN 'Other' THEN
      RETURN 'other_recovery_support';
    ELSE
      RETURN NULL;
  END CASE;
END;
$$;

CREATE OR REPLACE FUNCTION public.sync_meeting_checkin_to_family_engagement_event()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  participant_role TEXT;
  relationship_label TEXT;
  org_id UUID;
  current_phase_id UUID;
  support_category TEXT;
BEGIN
  SELECT fm.role, fm.relationship_type::text
  INTO participant_role, relationship_label
  FROM public.family_members fm
  WHERE fm.family_id = NEW.family_id
    AND fm.user_id = NEW.user_id
  LIMIT 1;

  IF participant_role IS NULL OR participant_role = 'recovering' THEN
    RETURN NEW;
  END IF;

  SELECT f.organization_id INTO org_id
  FROM public.families f
  WHERE f.id = NEW.family_id;

  SELECT cp.id INTO current_phase_id
  FROM public.care_phases cp
  WHERE cp.family_id = NEW.family_id
    AND cp.user_id IN (
      SELECT fm.user_id FROM public.family_members fm
      WHERE fm.family_id = NEW.family_id AND fm.role = 'recovering'
      LIMIT 1
    )
    AND cp.is_current = true
  ORDER BY cp.started_at DESC
  LIMIT 1;

  support_category := public.map_meeting_type_to_support_category(NEW.meeting_type);

  IF support_category IS NULL THEN
    RETURN NEW;
  END IF;

  INSERT INTO public.family_engagement_events (
    family_id,
    recovering_user_id,
    participant_user_id,
    organization_id,
    care_phase_id,
    source_table,
    source_record_id,
    event_type,
    engagement_domain,
    meeting_type,
    support_category,
    valence,
    intensity,
    confidence,
    occurred_at,
    notes,
    metadata
  )
  VALUES (
    NEW.family_id,
    (
      SELECT fm.user_id FROM public.family_members fm
      WHERE fm.family_id = NEW.family_id AND fm.role = 'recovering'
      LIMIT 1
    ),
    NEW.user_id,
    org_id,
    current_phase_id,
    'meeting_checkins',
    NEW.id,
    'support_checkin',
    'direct_support',
    NEW.meeting_type,
    support_category,
    'supportive',
    CASE
      WHEN NEW.meeting_type IN ('Therapy', 'Support Group') THEN 4
      WHEN NEW.meeting_type IN ('Al-Anon', 'Nar-Anon', 'ACA', 'CoDA', 'Families Anonymous') THEN 3
      ELSE 2
    END,
    0.95,
    NEW.checked_in_at,
    NEW.notes,
    jsonb_build_object(
      'participant_role', participant_role,
      'relationship_type', relationship_label,
      'meeting_name', NEW.meeting_name,
      'meeting_address', NEW.meeting_address,
      'source', 'meeting_checkin'
    )
  )
  ON CONFLICT (source_table, source_record_id, event_type)
  DO UPDATE SET
    meeting_type = EXCLUDED.meeting_type,
    support_category = EXCLUDED.support_category,
    occurred_at = EXCLUDED.occurred_at,
    notes = EXCLUDED.notes,
    metadata = EXCLUDED.metadata,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS sync_meeting_checkin_to_family_engagement_event ON public.meeting_checkins;
CREATE TRIGGER sync_meeting_checkin_to_family_engagement_event
  AFTER INSERT OR UPDATE ON public.meeting_checkins
  FOR EACH ROW EXECUTE FUNCTION public.sync_meeting_checkin_to_family_engagement_event();

ALTER TABLE public.accountability_scores
  ADD COLUMN IF NOT EXISTS supportiveness_score INTEGER CHECK (supportiveness_score >= 0 AND supportiveness_score <= 100),
  ADD COLUMN IF NOT EXISTS criticism_score INTEGER CHECK (criticism_score >= 0 AND criticism_score <= 100),
  ADD COLUMN IF NOT EXISTS enabling_score INTEGER CHECK (enabling_score >= 0 AND enabling_score <= 100),
  ADD COLUMN IF NOT EXISTS emotional_regulation_score INTEGER CHECK (emotional_regulation_score >= 0 AND emotional_regulation_score <= 100),
  ADD COLUMN IF NOT EXISTS boundary_consistency_score INTEGER CHECK (boundary_consistency_score >= 0 AND boundary_consistency_score <= 100),
  ADD COLUMN IF NOT EXISTS recovery_alignment_score INTEGER CHECK (recovery_alignment_score >= 0 AND recovery_alignment_score <= 100),
  ADD COLUMN IF NOT EXISTS communication_valence TEXT CHECK (communication_valence IN ('supportive', 'mixed', 'strained', 'destabilizing'));

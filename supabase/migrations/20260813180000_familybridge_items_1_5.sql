-- FamilyBridge items 1-5: journey stages, enabling checks, hold/slip ritual.
-- Do NOT apply this to live Supabase from the agent. Matt should paste it in Lovable.

-- ============================================================
-- 1) Honest journey stages (keep existing four)
-- ============================================================
DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'families'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%journey_stage%'
  LOOP
    EXECUTE format('ALTER TABLE public.families DROP CONSTRAINT %I', conname);
  END LOOP;
END $$;

ALTER TABLE public.families
  ADD CONSTRAINT families_journey_stage_check
  CHECK (
    journey_stage IS NULL OR journey_stage IN (
      'considering',
      'preparing',
      'intervention',
      'aftercare',
      'active_use',
      'early_recovery'
    )
  );

COMMENT ON COLUMN public.families.journey_stage IS
  'Where the family is right now. Includes intervention-path stages and real-life stages: active_use (no intervention yet) and early_recovery (at home). NULL = not yet chosen.';

CREATE OR REPLACE FUNCTION public.set_family_journey_stage(_family_id uuid, _stage text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF _stage NOT IN (
    'considering',
    'preparing',
    'intervention',
    'aftercare',
    'active_use',
    'early_recovery'
  ) THEN
    RAISE EXCEPTION 'Invalid journey stage: %', _stage;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = _family_id AND user_id = auth.uid()
  ) THEN
    RAISE EXCEPTION 'Not a member of this family';
  END IF;

  UPDATE public.families
  SET journey_stage = _stage, updated_at = now()
  WHERE id = _family_id;
END;
$$;

REVOKE ALL ON FUNCTION public.set_family_journey_stage(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.set_family_journey_stage(uuid, text) TO authenticated;

-- ============================================================
-- 2) Persist enabling-check results to the family
-- ============================================================
CREATE TABLE IF NOT EXISTS public.enabling_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id uuid NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  trigger_type text NOT NULL CHECK (trigger_type IN ('financial_request', 'boundary', 'full_exercise')),
  related_request_id uuid,
  related_boundary_id uuid REFERENCES public.family_boundaries(id) ON DELETE SET NULL,
  answers jsonb NOT NULL DEFAULT '{}'::jsonb,
  enabling_count integer NOT NULL DEFAULT 0,
  total_questions integer NOT NULL DEFAULT 0,
  result_type text NOT NULL CHECK (result_type IN ('warning', 'caution', 'okay')),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS enabling_checks_family_created_idx
  ON public.enabling_checks (family_id, created_at DESC);

ALTER TABLE public.enabling_checks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view enabling checks" ON public.enabling_checks;
CREATE POLICY "Family members can view enabling checks"
  ON public.enabling_checks FOR SELECT
  USING (public.is_family_member(family_id, auth.uid()));

DROP POLICY IF EXISTS "Family members can insert own enabling checks" ON public.enabling_checks;
CREATE POLICY "Family members can insert own enabling checks"
  ON public.enabling_checks FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_family_member(family_id, auth.uid())
  );

-- ============================================================
-- 3) Hold / slipped ritual on existing consequence_events
-- ============================================================
DO $$
DECLARE
  conname text;
BEGIN
  FOR conname IN
    SELECT c.conname
    FROM pg_constraint c
    JOIN pg_class t ON t.oid = c.conrelid
    JOIN pg_namespace n ON n.oid = t.relnamespace
    WHERE n.nspname = 'public'
      AND t.relname = 'consequence_events'
      AND c.contype = 'c'
      AND pg_get_constraintdef(c.oid) ILIKE '%event_type%'
  LOOP
    EXECUTE format('ALTER TABLE public.consequence_events DROP CONSTRAINT %I', conname);
  END LOOP;
END $$;

ALTER TABLE public.consequence_events
  ADD CONSTRAINT consequence_events_event_type_check
  CHECK (event_type IN ('violation', 'enforced', 'failed', 'held', 'slipped'));

CREATE OR REPLACE FUNCTION public.update_boundary_consequence_counts()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.event_type = 'violation' THEN
    UPDATE public.family_boundaries
    SET last_violation_at = NEW.created_at
    WHERE id = NEW.boundary_id;
  ELSIF NEW.event_type IN ('enforced', 'held') THEN
    UPDATE public.family_boundaries
    SET consequence_enforced_count = consequence_enforced_count + 1,
        last_enforcement_at = NEW.created_at
    WHERE id = NEW.boundary_id;
  ELSIF NEW.event_type IN ('failed', 'slipped') THEN
    UPDATE public.family_boundaries
    SET consequence_failed_count = consequence_failed_count + 1
    WHERE id = NEW.boundary_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP POLICY IF EXISTS "Family members can log hold or slip" ON public.consequence_events;
CREATE POLICY "Family members can log hold or slip"
  ON public.consequence_events FOR INSERT
  WITH CHECK (
    logged_by = auth.uid()
    AND public.is_family_member(family_id, auth.uid())
    AND event_type IN ('held', 'slipped', 'enforced', 'failed', 'violation')
  );

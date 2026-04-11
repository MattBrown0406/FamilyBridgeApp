
-- Helper function: check if user is a non-recovering member of a family
CREATE OR REPLACE FUNCTION public.is_non_recovering_family_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND role != 'recovering'
  )
$$;

-- ============================================
-- 1. Intervention Readiness Profiles
-- ============================================
CREATE TABLE public.intervention_readiness_profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  client_name TEXT NOT NULL,
  case_status TEXT NOT NULL DEFAULT 'monitoring',
  summary TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_readiness_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-recovering members can view profiles"
  ON public.intervention_readiness_profiles FOR SELECT
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can create profiles"
  ON public.intervention_readiness_profiles FOR INSERT
  WITH CHECK (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can update profiles"
  ON public.intervention_readiness_profiles FOR UPDATE
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can delete profiles"
  ON public.intervention_readiness_profiles FOR DELETE
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE TRIGGER update_irp_updated_at
  BEFORE UPDATE ON public.intervention_readiness_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 2. Intervention Readiness Scores (snapshots)
-- ============================================
CREATE TABLE public.intervention_readiness_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.intervention_readiness_profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  total_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  status_label TEXT NOT NULL DEFAULT 'Not Ready',
  distress NUMERIC(4,2) NOT NULL DEFAULT 0,
  consequence_awareness NUMERIC(4,2) NOT NULL DEFAULT 0,
  resistance_fatigue NUMERIC(4,2) NOT NULL DEFAULT 0,
  instability NUMERIC(4,2) NOT NULL DEFAULT 0,
  help_proximity NUMERIC(4,2) NOT NULL DEFAULT 0,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_readiness_scores ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-recovering members can view scores"
  ON public.intervention_readiness_scores FOR SELECT
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can insert scores"
  ON public.intervention_readiness_scores FOR INSERT
  WITH CHECK (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE INDEX idx_irs_profile_recorded ON public.intervention_readiness_scores(profile_id, recorded_at DESC);

-- ============================================
-- 3. Intervention Signals (observed indicators)
-- ============================================
CREATE TABLE public.intervention_signals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.intervention_readiness_profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  source_type TEXT NOT NULL DEFAULT 'manual_clinician_note',
  description TEXT NOT NULL,
  category_tags TEXT[] NOT NULL DEFAULT '{}',
  impact_direction TEXT NOT NULL DEFAULT 'neutral',
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_signals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-recovering members can view signals"
  ON public.intervention_signals FOR SELECT
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can create signals"
  ON public.intervention_signals FOR INSERT
  WITH CHECK (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can delete signals"
  ON public.intervention_signals FOR DELETE
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE INDEX idx_is_profile_created ON public.intervention_signals(profile_id, created_at DESC);

-- ============================================
-- 4. Intervention Clinician Notes
-- ============================================
CREATE TABLE public.intervention_clinician_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.intervention_readiness_profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  note_type TEXT NOT NULL DEFAULT 'pattern_observation',
  text TEXT NOT NULL,
  category TEXT,
  follow_up BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_clinician_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-recovering members can view notes"
  ON public.intervention_clinician_notes FOR SELECT
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can create notes"
  ON public.intervention_clinician_notes FOR INSERT
  WITH CHECK (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can update notes"
  ON public.intervention_clinician_notes FOR UPDATE
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE INDEX idx_icn_profile_created ON public.intervention_clinician_notes(profile_id, created_at DESC);

-- ============================================
-- 5. Intervention Alerts
-- ============================================
CREATE TABLE public.intervention_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.intervention_readiness_profiles(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  threshold INTEGER NOT NULL,
  title TEXT NOT NULL,
  explanation TEXT,
  contributing_signals TEXT[],
  urgency TEXT NOT NULL DEFAULT 'medium',
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intervention_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Non-recovering members can view alerts"
  ON public.intervention_alerts FOR SELECT
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can create alerts"
  ON public.intervention_alerts FOR INSERT
  WITH CHECK (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE POLICY "Non-recovering members can update alerts"
  ON public.intervention_alerts FOR UPDATE
  USING (
    public.is_non_recovering_family_member(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  );

CREATE INDEX idx_ia_profile ON public.intervention_alerts(profile_id, created_at DESC);

-- ============================================
-- 6. Notification trigger for readiness score changes
--    Only notifies non-recovering family members
-- ============================================
CREATE OR REPLACE FUNCTION public.notify_readiness_score_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  member RECORD;
  v_profile_name TEXT;
  v_alert_title TEXT;
  v_alert_body TEXT;
  v_urgency TEXT;
  v_prev_label TEXT;
BEGIN
  -- Get the profile name
  SELECT client_name INTO v_profile_name
  FROM intervention_readiness_profiles
  WHERE id = NEW.profile_id;

  -- Determine if we crossed a threshold
  -- Check the previous score for this profile
  SELECT status_label INTO v_prev_label
  FROM intervention_readiness_scores
  WHERE profile_id = NEW.profile_id
    AND id != NEW.id
  ORDER BY recorded_at DESC
  LIMIT 1;

  -- Only notify if status label changed
  IF v_prev_label IS NOT NULL AND v_prev_label = NEW.status_label THEN
    RETURN NEW;
  END IF;

  -- Build alert message based on new status
  CASE NEW.status_label
    WHEN 'Critical Window' THEN
      v_alert_title := '🔴 Critical Intervention Window Detected';
      v_alert_body := 'Readiness score for ' || COALESCE(v_profile_name, 'the individual') || ' has reached ' || ROUND(NEW.total_score) || '. Immediate intervention action is recommended within 24–72 hours.';
      v_urgency := 'critical';
    WHEN 'Active Window' THEN
      v_alert_title := '🟠 Active Intervention Window';
      v_alert_body := 'Readiness score for ' || COALESCE(v_profile_name, 'the individual') || ' is elevated at ' || ROUND(NEW.total_score) || '. Begin intervention coordination and treatment placement planning.';
      v_urgency := 'high';
    WHEN 'Emerging Window' THEN
      v_alert_title := '🟡 Emerging Readiness Window';
      v_alert_body := 'Readiness indicators for ' || COALESCE(v_profile_name, 'the individual') || ' show emerging patterns at ' || ROUND(NEW.total_score) || '. Continue observation and quiet preparation.';
      v_urgency := 'medium';
    ELSE
      -- Don't notify for "Not Ready" unless dropping from a higher state
      IF v_prev_label IS NOT NULL AND v_prev_label != 'Not Ready' THEN
        v_alert_title := '⬇️ Readiness Window Closing';
        v_alert_body := 'Readiness score for ' || COALESCE(v_profile_name, 'the individual') || ' has decreased to ' || ROUND(NEW.total_score) || '. The intervention window may be closing. Reassess strategy.';
        v_urgency := 'low';
      ELSE
        RETURN NEW;
      END IF;
  END CASE;

  -- Insert alert record
  INSERT INTO intervention_alerts (profile_id, family_id, threshold, title, explanation, urgency)
  VALUES (NEW.profile_id, NEW.family_id, ROUND(NEW.total_score), v_alert_title, v_alert_body, v_urgency);

  -- Notify ONLY non-recovering family members
  FOR member IN
    SELECT fm.user_id
    FROM family_members fm
    WHERE fm.family_id = NEW.family_id
      AND fm.role != 'recovering'
  LOOP
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      member.user_id,
      NEW.family_id,
      'intervention_readiness',
      v_alert_title,
      v_alert_body,
      NEW.profile_id
    );
  END LOOP;

  -- Also notify managing org members
  FOR member IN
    SELECT om.user_id
    FROM families f
    JOIN organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = NEW.family_id
      AND f.organization_id IS NOT NULL
  LOOP
    INSERT INTO notifications (user_id, family_id, type, title, body, related_id)
    VALUES (
      member.user_id,
      NEW.family_id,
      'intervention_readiness',
      v_alert_title,
      v_alert_body,
      NEW.profile_id
    );
  END LOOP;

  RETURN NEW;
END;
$$;

CREATE TRIGGER notify_on_readiness_score_change
  AFTER INSERT ON public.intervention_readiness_scores
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_readiness_score_change();

ALTER TABLE public.medications
ADD COLUMN IF NOT EXISTS quantity_dispensed INTEGER,
ADD COLUMN IF NOT EXISTS units_remaining NUMERIC,
ADD COLUMN IF NOT EXISTS unit_type TEXT,
ADD COLUMN IF NOT EXISTS doses_per_administration NUMERIC NOT NULL DEFAULT 1,
ADD COLUMN IF NOT EXISTS days_supply INTEGER,
ADD COLUMN IF NOT EXISTS expected_runout_date DATE,
ADD COLUMN IF NOT EXISTS refill_reminder_days INTEGER NOT NULL DEFAULT 7,
ADD COLUMN IF NOT EXISTS refill_due_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS low_supply_threshold INTEGER,
ADD COLUMN IF NOT EXISTS low_supply_notified_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS risk_level TEXT NOT NULL DEFAULT 'standard',
ADD COLUMN IF NOT EXISTS is_prn BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS max_daily_doses INTEGER,
ADD COLUMN IF NOT EXISTS min_hours_between_doses NUMERIC,
ADD COLUMN IF NOT EXISTS out_of_medication_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS last_inventory_reconciled_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS inventory_notes TEXT,
ADD COLUMN IF NOT EXISTS prescriber_name TEXT,
ADD COLUMN IF NOT EXISTS prescriber_phone TEXT;

UPDATE public.medications
SET prescriber_name = doctor_name
WHERE prescriber_name IS NULL AND doctor_name IS NOT NULL;

UPDATE public.medications
SET prescriber_phone = doctor_phone
WHERE prescriber_phone IS NULL AND doctor_phone IS NOT NULL;

UPDATE public.medications
SET is_prn = true
WHERE lower(coalesce(frequency, '')) IN ('as needed', 'prn');

UPDATE public.medications
SET expected_runout_date = (
  COALESCE(last_refill_date, CURRENT_DATE)
  + make_interval(days => GREATEST(days_supply, 0))
)::date
WHERE expected_runout_date IS NULL
  AND last_refill_date IS NOT NULL
  AND days_supply IS NOT NULL;

ALTER TABLE public.medication_doses
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'scheduled',
ADD COLUMN IF NOT EXISTS confirmation_type TEXT,
ADD COLUMN IF NOT EXISTS inventory_delta NUMERIC,
ADD COLUMN IF NOT EXISTS overdue_notified_user_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS overdue_notified_family_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS snoozed_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS taken_notes TEXT;

ALTER TABLE public.medication_alerts
ADD COLUMN IF NOT EXISTS escalation_stage TEXT,
ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.medication_inventory_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  quantity_change NUMERIC NOT NULL,
  units_remaining_after NUMERIC,
  note TEXT,
  related_dose_id UUID REFERENCES public.medication_doses(id) ON DELETE SET NULL,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medication_inventory_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view medication inventory events"
ON public.medication_inventory_events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_inventory_events.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can add medication inventory events"
ON public.medication_inventory_events FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_inventory_events.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE INDEX IF NOT EXISTS idx_medication_inventory_events_medication_id
ON public.medication_inventory_events(medication_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.recalculate_medication_inventory(_medication_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  med RECORD;
  total_consumed NUMERIC;
BEGIN
  SELECT * INTO med
  FROM public.medications
  WHERE id = _medication_id;

  IF med IS NULL THEN
    RETURN;
  END IF;

  SELECT COALESCE(SUM(COALESCE(inventory_delta, 0)), 0)
  INTO total_consumed
  FROM public.medication_doses
  WHERE medication_id = _medication_id
    AND taken_at IS NOT NULL;

  UPDATE public.medications
  SET units_remaining = CASE
      WHEN quantity_dispensed IS NULL THEN units_remaining
      ELSE GREATEST(
        COALESCE(quantity_dispensed::numeric, 0)
        - total_consumed
        + COALESCE((
          SELECT SUM(quantity_change)
          FROM public.medication_inventory_events mie
          WHERE mie.medication_id = _medication_id
        ), 0),
        0
      )
    END,
    expected_runout_date = CASE
      WHEN last_refill_date IS NOT NULL AND days_supply IS NOT NULL THEN
        (last_refill_date + days_supply)
      WHEN units_remaining IS NOT NULL
        AND doses_per_administration IS NOT NULL
        AND times_per_day IS NOT NULL
        AND times_per_day > 0
        AND is_prn = false THEN
        (
          CURRENT_DATE + CEIL(units_remaining / NULLIF(doses_per_administration * times_per_day, 0))::int
        )
      ELSE expected_runout_date
    END,
    out_of_medication_at = CASE
      WHEN quantity_dispensed IS NOT NULL AND (
        GREATEST(
          COALESCE(quantity_dispensed::numeric, 0)
          - total_consumed
          + COALESCE((
            SELECT SUM(quantity_change)
            FROM public.medication_inventory_events mie
            WHERE mie.medication_id = _medication_id
          ), 0),
          0
        )
      ) <= 0 THEN COALESCE(out_of_medication_at, now())
      ELSE NULL
    END,
    last_inventory_reconciled_at = now()
  WHERE id = _medication_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.generate_medication_doses_for_day(
  _medication_id UUID,
  _target_date DATE DEFAULT CURRENT_DATE
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  med RECORD;
  time_slot TEXT;
  scheduled_timestamp TIMESTAMP WITH TIME ZONE;
BEGIN
  SELECT * INTO med FROM public.medications WHERE id = _medication_id AND is_active = true;

  IF med IS NULL OR med.is_prn = true THEN
    RETURN;
  END IF;

  IF med.specific_times IS NOT NULL AND array_length(med.specific_times, 1) > 0 THEN
    FOREACH time_slot IN ARRAY med.specific_times
    LOOP
      scheduled_timestamp := ((_target_date::text || ' ' || time_slot)::timestamp AT TIME ZONE 'America/Los_Angeles');

      INSERT INTO public.medication_doses (
        medication_id,
        family_id,
        user_id,
        scheduled_at,
        scheduled_time,
        inventory_delta
      )
      VALUES (
        med.id,
        med.family_id,
        med.user_id,
        scheduled_timestamp,
        time_slot,
        med.doses_per_administration
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_missed_medication_doses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dose RECORD;
  family_notice_threshold INTERVAL;
BEGIN
  FOR dose IN
    SELECT md.*, m.medication_name, m.risk_level, m.is_prn
    FROM public.medication_doses md
    JOIN public.medications m ON m.id = md.medication_id
    WHERE md.taken_at IS NULL
      AND md.skipped = false
      AND m.is_prn = false
      AND md.scheduled_at < NOW() - INTERVAL '30 minutes'
      AND md.scheduled_at > NOW() - INTERVAL '24 hours'
  LOOP
    family_notice_threshold := CASE
      WHEN dose.risk_level = 'critical' THEN INTERVAL '1 hour'
      WHEN dose.risk_level = 'high' THEN INTERVAL '2 hours'
      ELSE INTERVAL '4 hours'
    END;

    IF dose.overdue_notified_user_at IS NULL THEN
      INSERT INTO public.medication_alerts (
        medication_id, dose_id, family_id, user_id, alert_type, escalation_stage, message, metadata
      )
      VALUES (
        dose.medication_id,
        dose.id,
        dose.family_id,
        dose.user_id,
        'missed_dose',
        'user_reminder',
        'Reminder: ' || dose.medication_name || ' was scheduled for ' || to_char(dose.scheduled_at, 'h:MI AM') || '.',
        jsonb_build_object('risk_level', dose.risk_level)
      );

      UPDATE public.medication_doses
      SET overdue_notified_user_at = now(),
          status = 'overdue'
      WHERE id = dose.id;
    ELSIF dose.overdue_notified_family_at IS NULL
      AND dose.scheduled_at < NOW() - family_notice_threshold THEN
      INSERT INTO public.medication_alerts (
        medication_id, dose_id, family_id, user_id, alert_type, escalation_stage, message, metadata
      )
      VALUES (
        dose.medication_id,
        dose.id,
        dose.family_id,
        dose.user_id,
        'missed_dose',
        'family_alert',
        'Missed dose of ' || dose.medication_name || ' scheduled for ' || to_char(dose.scheduled_at, 'h:MI AM'),
        jsonb_build_object('risk_level', dose.risk_level)
      );

      UPDATE public.medication_doses
      SET overdue_notified_family_at = now(),
          overdue_alert_sent = true,
          status = 'missed'
      WHERE id = dose.id;

      INSERT INTO public.notifications (user_id, family_id, type, title, body, related_id)
      SELECT
        fm.user_id,
        dose.family_id,
        'missed_medication',
        '💊 Missed Medication Alert',
        'A dose of ' || dose.medication_name || ' was missed. Scheduled for ' || to_char(dose.scheduled_at, 'h:MI AM'),
        dose.id
      FROM public.family_members fm
      WHERE fm.family_id = dose.family_id
        AND fm.user_id != dose.user_id;
    END IF;
  END LOOP;
END;
$$;

CREATE OR REPLACE FUNCTION public.check_medication_refill_status()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  med RECORD;
BEGIN
  FOR med IN
    SELECT *
    FROM public.medications
    WHERE is_active = true
      AND (
        (expected_runout_date IS NOT NULL AND expected_runout_date <= CURRENT_DATE + COALESCE(refill_reminder_days, 7))
        OR (units_remaining IS NOT NULL AND low_supply_threshold IS NOT NULL AND units_remaining <= low_supply_threshold)
      )
  LOOP
    IF med.expected_runout_date IS NOT NULL
      AND med.expected_runout_date <= CURRENT_DATE + COALESCE(med.refill_reminder_days, 7)
      AND med.refill_due_notified_at IS NULL THEN
      INSERT INTO public.medication_alerts (
        medication_id, family_id, user_id, alert_type, escalation_stage, message, metadata
      )
      VALUES (
        med.id,
        med.family_id,
        med.user_id,
        'refill_due',
        'user_reminder',
        med.medication_name || ' may need a refill within ' || COALESCE(med.refill_reminder_days, 7) || ' days.',
        jsonb_build_object('expected_runout_date', med.expected_runout_date)
      );

      UPDATE public.medications
      SET refill_due_notified_at = now()
      WHERE id = med.id;
    END IF;

    IF med.units_remaining IS NOT NULL
      AND med.low_supply_threshold IS NOT NULL
      AND med.units_remaining <= med.low_supply_threshold
      AND med.low_supply_notified_at IS NULL THEN
      INSERT INTO public.medication_alerts (
        medication_id, family_id, user_id, alert_type, escalation_stage, message, metadata
      )
      VALUES (
        med.id,
        med.family_id,
        med.user_id,
        'low_supply',
        'user_reminder',
        med.medication_name || ' is running low with about ' || med.units_remaining || ' ' || COALESCE(med.unit_type, 'units') || ' remaining.',
        jsonb_build_object('units_remaining', med.units_remaining)
      );

      UPDATE public.medications
      SET low_supply_notified_at = now()
      WHERE id = med.id;
    END IF;
  END LOOP;
END;
$$;

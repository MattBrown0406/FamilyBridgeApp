-- Create medications table
CREATE TABLE public.medications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The recovering member this medication belongs to
  created_by UUID NOT NULL, -- Who added the medication
  
  -- Extracted from label
  medication_name TEXT NOT NULL,
  dosage TEXT,
  pharmacy_name TEXT,
  pharmacy_phone TEXT,
  doctor_name TEXT,
  doctor_phone TEXT,
  last_refill_date DATE,
  refills_remaining INTEGER,
  
  -- Additional info
  instructions TEXT,
  frequency TEXT, -- e.g., "twice daily", "every 8 hours"
  times_per_day INTEGER DEFAULT 1,
  specific_times TEXT[], -- e.g., ["08:00", "20:00"]
  
  -- Label image
  label_image_url TEXT,
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  discontinued_at TIMESTAMP WITH TIME ZONE,
  discontinued_reason TEXT,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication doses table to track compliance
CREATE TABLE public.medication_doses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The person who should take the dose
  
  -- Scheduling
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  scheduled_time TEXT, -- The time of day (e.g., "08:00")
  
  -- Completion
  taken_at TIMESTAMP WITH TIME ZONE,
  skipped BOOLEAN DEFAULT false,
  skip_reason TEXT,
  confirmed_by UUID, -- Who confirmed the dose was taken (self or observer)
  
  -- Alerts
  reminder_sent_at TIMESTAMP WITH TIME ZONE,
  overdue_alert_sent BOOLEAN DEFAULT false,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medication alerts table
CREATE TABLE public.medication_alerts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  medication_id UUID NOT NULL REFERENCES public.medications(id) ON DELETE CASCADE,
  dose_id UUID REFERENCES public.medication_doses(id) ON DELETE SET NULL,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL, -- The recovering member
  
  alert_type TEXT NOT NULL, -- 'missed_dose', 'low_refills', 'refill_due'
  message TEXT NOT NULL,
  
  acknowledged_at TIMESTAMP WITH TIME ZONE,
  acknowledged_by UUID,
  
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_doses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_alerts ENABLE ROW LEVEL SECURITY;

-- Medications RLS policies
CREATE POLICY "Family members can view medications"
ON public.medications FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medications.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can add medications"
ON public.medications FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medications.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Admins and moderators can update medications"
ON public.medications FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medications.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
  OR user_id = auth.uid()
  OR created_by = auth.uid()
);

CREATE POLICY "Admins and moderators can delete medications"
ON public.medications FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medications.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
  OR created_by = auth.uid()
);

-- Medication doses RLS policies
CREATE POLICY "Family members can view medication doses"
ON public.medication_doses FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_doses.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can create medication doses"
ON public.medication_doses FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_doses.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can update their own doses"
ON public.medication_doses FOR UPDATE
USING (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_doses.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Medication alerts RLS policies
CREATE POLICY "Family members can view medication alerts"
ON public.medication_alerts FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_alerts.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "System can create medication alerts"
ON public.medication_alerts FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_alerts.family_id
    AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Users can acknowledge alerts"
ON public.medication_alerts FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = medication_alerts.family_id
    AND fm.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_medications_family_id ON public.medications(family_id);
CREATE INDEX idx_medications_user_id ON public.medications(user_id);
CREATE INDEX idx_medications_active ON public.medications(family_id, is_active);

CREATE INDEX idx_medication_doses_medication_id ON public.medication_doses(medication_id);
CREATE INDEX idx_medication_doses_scheduled ON public.medication_doses(scheduled_at);
CREATE INDEX idx_medication_doses_user_pending ON public.medication_doses(user_id, scheduled_at) WHERE taken_at IS NULL AND skipped = false;

CREATE INDEX idx_medication_alerts_family_id ON public.medication_alerts(family_id);
CREATE INDEX idx_medication_alerts_unacknowledged ON public.medication_alerts(family_id, created_at) WHERE acknowledged_at IS NULL;

-- Create trigger for updated_at
CREATE TRIGGER update_medications_updated_at
BEFORE UPDATE ON public.medications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate daily medication doses
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
  -- Get medication details
  SELECT * INTO med FROM public.medications WHERE id = _medication_id AND is_active = true;
  
  IF med IS NULL THEN
    RETURN;
  END IF;
  
  -- Generate doses for each scheduled time
  IF med.specific_times IS NOT NULL AND array_length(med.specific_times, 1) > 0 THEN
    FOREACH time_slot IN ARRAY med.specific_times
    LOOP
      scheduled_timestamp := (_target_date::text || ' ' || time_slot)::timestamp AT TIME ZONE 'America/New_York';
      
      -- Only insert if dose doesn't already exist
      INSERT INTO public.medication_doses (medication_id, family_id, user_id, scheduled_at, scheduled_time)
      VALUES (med.id, med.family_id, med.user_id, scheduled_timestamp, time_slot)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END IF;
END;
$$;

-- Create function to check for missed doses and create alerts
CREATE OR REPLACE FUNCTION public.check_missed_medication_doses()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  dose RECORD;
  med RECORD;
BEGIN
  -- Find doses that are overdue by 30+ minutes and haven't had alerts sent
  FOR dose IN 
    SELECT md.*, m.medication_name
    FROM public.medication_doses md
    JOIN public.medications m ON m.id = md.medication_id
    WHERE md.taken_at IS NULL
      AND md.skipped = false
      AND md.overdue_alert_sent = false
      AND md.scheduled_at < NOW() - INTERVAL '30 minutes'
      AND md.scheduled_at > NOW() - INTERVAL '24 hours' -- Only recent doses
  LOOP
    -- Create alert
    INSERT INTO public.medication_alerts (medication_id, dose_id, family_id, user_id, alert_type, message)
    VALUES (
      dose.medication_id,
      dose.id,
      dose.family_id,
      dose.user_id,
      'missed_dose',
      'Missed dose of ' || dose.medication_name || ' scheduled for ' || to_char(dose.scheduled_at, 'h:MI AM')
    );
    
    -- Mark alert as sent
    UPDATE public.medication_doses
    SET overdue_alert_sent = true
    WHERE id = dose.id;
    
    -- Create notification for family members
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
      AND fm.user_id != dose.user_id; -- Notify everyone except the person who missed
  END LOOP;
END;
$$;

-- Post medication compliance to chat
CREATE OR REPLACE FUNCTION public.post_medication_compliance_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_name TEXT;
  med_name TEXT;
BEGIN
  -- Only fire when taken_at changes from NULL to a value
  IF OLD.taken_at IS NULL AND NEW.taken_at IS NOT NULL THEN
    SELECT full_name INTO user_name FROM profiles WHERE id = NEW.user_id;
    SELECT medication_name INTO med_name FROM medications WHERE id = NEW.medication_id;
    
    INSERT INTO messages (family_id, sender_id, content)
    VALUES (
      NEW.family_id,
      NEW.user_id,
      '💊 **Medication Taken**' || E'\n\n' ||
      COALESCE(user_name, 'A family member') || ' took their ' || COALESCE(med_name, 'medication') || '.' || E'\n' ||
      '✅ _Scheduled for ' || to_char(NEW.scheduled_at, 'h:MI AM') || ', taken at ' || to_char(NEW.taken_at, 'h:MI AM') || '_'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER post_medication_taken_message
AFTER UPDATE ON public.medication_doses
FOR EACH ROW
EXECUTE FUNCTION public.post_medication_compliance_message();

-- Enable realtime for medication alerts
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_alerts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.medication_doses;
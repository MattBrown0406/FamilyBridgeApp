
-- 1. Provider FIIS Settings table for customization layer
CREATE TABLE public.provider_fiis_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  alert_sensitivity TEXT NOT NULL DEFAULT 'balanced' CHECK (alert_sensitivity IN ('conservative', 'balanced', 'stabilized')),
  risk_accumulation_window_days INTEGER NOT NULL DEFAULT 14,
  silence_sensitivity_hours INTEGER NOT NULL DEFAULT 48,
  aftercare_tolerance_percent INTEGER NOT NULL DEFAULT 70,
  mat_counts_as_sobriety BOOLEAN NOT NULL DEFAULT true,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(organization_id, family_id)
);

ALTER TABLE public.provider_fiis_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view their settings"
  ON public.provider_fiis_settings FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage settings"
  ON public.provider_fiis_settings FOR ALL
  USING (public.is_org_admin(organization_id, auth.uid()));

-- 2. Add primary_patient flag to family_members for multiple patient support
ALTER TABLE public.family_members
  ADD COLUMN is_primary_patient BOOLEAN NOT NULL DEFAULT false;

-- 3. Add consequence tracking columns to family_boundaries
ALTER TABLE public.family_boundaries
  ADD COLUMN consequence_enforced_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN consequence_failed_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN last_violation_at TIMESTAMP WITH TIME ZONE,
  ADD COLUMN last_enforcement_at TIMESTAMP WITH TIME ZONE;

-- 4. Create consequence_events table for tracking enforcement/failure
CREATE TABLE public.consequence_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  boundary_id UUID NOT NULL REFERENCES public.family_boundaries(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('violation', 'enforced', 'failed')),
  logged_by UUID NOT NULL,
  notes TEXT,
  auto_detected BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.consequence_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view consequence events"
  ON public.consequence_events FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_id = consequence_events.family_id AND user_id = auth.uid()
  ));

CREATE POLICY "Moderators and org members can manage consequence events"
  ON public.consequence_events FOR ALL
  USING (
    public.is_family_moderator(family_id, auth.uid()) OR
    public.is_managing_org_member(family_id, auth.uid())
  );

-- Trigger to update boundary counts on consequence events
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
  ELSIF NEW.event_type = 'enforced' THEN
    UPDATE public.family_boundaries
    SET consequence_enforced_count = consequence_enforced_count + 1,
        last_enforcement_at = NEW.created_at
    WHERE id = NEW.boundary_id;
  ELSIF NEW.event_type = 'failed' THEN
    UPDATE public.family_boundaries
    SET consequence_failed_count = consequence_failed_count + 1
    WHERE id = NEW.boundary_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_boundary_counts_on_consequence
  AFTER INSERT ON public.consequence_events
  FOR EACH ROW
  EXECUTE FUNCTION public.update_boundary_consequence_counts();

-- 5. Add is_mat column to medications table for MAT tracking
ALTER TABLE public.medications
  ADD COLUMN is_mat BOOLEAN NOT NULL DEFAULT false;

-- Trigger for updated_at on provider_fiis_settings
CREATE TRIGGER update_provider_fiis_settings_updated_at
  BEFORE UPDATE ON public.provider_fiis_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();


-- Communication templates for email/SMS outreach
CREATE TABLE public.crm_communication_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  name TEXT NOT NULL,
  template_type TEXT NOT NULL DEFAULT 'email' CHECK (template_type IN ('email', 'sms')),
  subject TEXT,
  body TEXT NOT NULL,
  stage TEXT,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_communication_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view templates"
  ON public.crm_communication_templates FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can manage templates"
  ON public.crm_communication_templates FOR ALL
  USING (public.is_org_member(organization_id, auth.uid()));

-- In-app calendar events for CRM
CREATE TABLE public.crm_calendar_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  title TEXT NOT NULL,
  description TEXT,
  event_type TEXT NOT NULL DEFAULT 'meeting' CHECK (event_type IN ('call', 'meeting', 'intake', 'follow_up', 'other')),
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ,
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE SET NULL,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  assigned_to UUID,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_calendar_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view calendar events"
  ON public.crm_calendar_events FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can manage calendar events"
  ON public.crm_calendar_events FOR ALL
  USING (public.is_org_member(organization_id, auth.uid()));

-- Follow-up reminder tracking
CREATE TABLE public.crm_follow_up_reminders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  lead_id UUID NOT NULL REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  assigned_to UUID NOT NULL,
  remind_at TIMESTAMPTZ NOT NULL,
  reminder_type TEXT NOT NULL DEFAULT 'follow_up',
  message TEXT,
  is_sent BOOLEAN NOT NULL DEFAULT false,
  sent_at TIMESTAMPTZ,
  is_dismissed BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.crm_follow_up_reminders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org members can view reminders"
  ON public.crm_follow_up_reminders FOR SELECT
  USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can manage reminders"
  ON public.crm_follow_up_reminders FOR ALL
  USING (public.is_org_member(organization_id, auth.uid()));

-- Add lost_reason categories to leads for analysis
ALTER TABLE public.crm_leads ADD COLUMN IF NOT EXISTS lost_category TEXT;

-- Stage-based auto-task creation function
CREATE OR REPLACE FUNCTION public.crm_auto_create_stage_tasks()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  task_title TEXT;
  task_due TIMESTAMPTZ;
  task_type TEXT;
BEGIN
  -- Only fire on stage changes
  IF OLD.stage = NEW.stage THEN
    RETURN NEW;
  END IF;

  -- Define tasks per stage
  CASE NEW.stage
    WHEN 'contacted' THEN
      task_title := 'Schedule intake call with ' || NEW.contact_name;
      task_due := now() + interval '2 days';
      task_type := 'call';
    WHEN 'intake' THEN
      task_title := 'Complete intake assessment for ' || NEW.contact_name;
      task_due := now() + interval '3 days';
      task_type := 'document';
    WHEN 'active' THEN
      task_title := 'Send welcome package to ' || NEW.contact_name;
      task_due := now() + interval '1 day';
      task_type := 'email';
    WHEN 'aftercare' THEN
      task_title := 'Create aftercare plan for ' || NEW.contact_name;
      task_due := now() + interval '5 days';
      task_type := 'follow_up';
    WHEN 'lost' THEN
      task_title := 'Follow up on lost lead: ' || NEW.contact_name;
      task_due := now() + interval '30 days';
      task_type := 'follow_up';
    ELSE
      RETURN NEW;
  END CASE;

  INSERT INTO public.crm_tasks (
    organization_id, created_by, title, task_type, priority,
    lead_id, due_date, assigned_to
  ) VALUES (
    NEW.organization_id,
    COALESCE(NEW.assigned_to, NEW.created_by),
    task_title,
    task_type,
    CASE WHEN NEW.stage IN ('active', 'intake') THEN 'high' ELSE 'medium' END,
    NEW.id,
    task_due,
    NEW.assigned_to
  );

  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_stage_auto_tasks
  AFTER UPDATE ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_auto_create_stage_tasks();

-- Auto-create follow-up reminder when lead is created
CREATE OR REPLACE FUNCTION public.crm_auto_follow_up_reminder()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.crm_follow_up_reminders (
    organization_id, lead_id, assigned_to, remind_at,
    reminder_type, message, created_by
  ) VALUES (
    NEW.organization_id,
    NEW.id,
    COALESCE(NEW.assigned_to, NEW.created_by),
    now() + interval '24 hours',
    'initial_follow_up',
    'Follow up with new lead: ' || NEW.contact_name,
    NEW.created_by
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER crm_new_lead_reminder
  AFTER INSERT ON public.crm_leads
  FOR EACH ROW
  EXECUTE FUNCTION public.crm_auto_follow_up_reminder();

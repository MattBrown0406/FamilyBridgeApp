-- CRM Pipeline Stages enum
CREATE TYPE public.crm_pipeline_stage AS ENUM (
  'lead',
  'contacted',
  'intake',
  'active',
  'aftercare',
  'alumni',
  'lost'
);

-- CRM Leads/Prospects table (potential families before they become active)
CREATE TABLE public.crm_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  assigned_to UUID,
  
  -- Contact info
  contact_name TEXT NOT NULL,
  contact_email TEXT,
  contact_phone TEXT,
  
  -- Patient/loved one info
  patient_name TEXT,
  patient_age TEXT,
  presenting_issue TEXT,
  
  -- Pipeline tracking
  stage crm_pipeline_stage NOT NULL DEFAULT 'lead',
  stage_entered_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Source tracking
  referral_source_id UUID,
  referral_notes TEXT,
  
  -- Conversion
  converted_to_family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  converted_at TIMESTAMPTZ,
  lost_reason TEXT,
  
  -- Metadata
  notes TEXT,
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  estimated_value DECIMAL(10,2),
  tags TEXT[],
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Referral Sources table
CREATE TABLE public.crm_referral_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  source_type TEXT NOT NULL CHECK (source_type IN ('hospital', 'therapist', 'physician', 'insurance', 'website', 'social_media', 'referral', 'alumni', 'other')),
  contact_name TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add FK for referral source
ALTER TABLE public.crm_leads 
ADD CONSTRAINT crm_leads_referral_source_fkey 
FOREIGN KEY (referral_source_id) REFERENCES public.crm_referral_sources(id) ON DELETE SET NULL;

-- CRM Tasks table
CREATE TABLE public.crm_tasks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL,
  assigned_to UUID,
  
  -- Task info
  title TEXT NOT NULL,
  description TEXT,
  task_type TEXT NOT NULL DEFAULT 'follow_up' CHECK (task_type IN ('follow_up', 'call', 'meeting', 'email', 'document', 'other')),
  priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  
  -- Related entities
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  
  -- Scheduling
  due_date TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- CRM Activity Log table (tracks all interactions)
CREATE TABLE public.crm_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  
  -- Activity type
  activity_type TEXT NOT NULL CHECK (activity_type IN ('call', 'email', 'meeting', 'note', 'stage_change', 'task_completed', 'document', 'sms', 'other')),
  
  -- Related entities
  lead_id UUID REFERENCES public.crm_leads(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE CASCADE,
  task_id UUID REFERENCES public.crm_tasks(id) ON DELETE SET NULL,
  
  -- Content
  title TEXT NOT NULL,
  description TEXT,
  metadata JSONB DEFAULT '{}',
  
  -- Timing
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_referral_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_activities ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_leads
CREATE POLICY "Org members can view their leads"
ON public.crm_leads FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create leads"
ON public.crm_leads FOR INSERT
WITH CHECK (is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Org members can update their org leads"
ON public.crm_leads FOR UPDATE
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can delete leads"
ON public.crm_leads FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for crm_referral_sources
CREATE POLICY "Org members can view referral sources"
ON public.crm_referral_sources FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can manage referral sources"
ON public.crm_referral_sources FOR ALL
USING (is_org_admin(organization_id, auth.uid()))
WITH CHECK (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for crm_tasks
CREATE POLICY "Org members can view their org tasks"
ON public.crm_tasks FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create tasks"
ON public.crm_tasks FOR INSERT
WITH CHECK (is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Org members can update their org tasks"
ON public.crm_tasks FOR UPDATE
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org admins can delete tasks"
ON public.crm_tasks FOR DELETE
USING (is_org_admin(organization_id, auth.uid()));

-- RLS Policies for crm_activities
CREATE POLICY "Org members can view their org activities"
ON public.crm_activities FOR SELECT
USING (is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create activities"
ON public.crm_activities FOR INSERT
WITH CHECK (is_org_member(organization_id, auth.uid()) AND user_id = auth.uid());

-- Indexes for performance
CREATE INDEX idx_crm_leads_org ON public.crm_leads(organization_id);
CREATE INDEX idx_crm_leads_stage ON public.crm_leads(stage);
CREATE INDEX idx_crm_leads_assigned ON public.crm_leads(assigned_to);
CREATE INDEX idx_crm_tasks_org ON public.crm_tasks(organization_id);
CREATE INDEX idx_crm_tasks_assigned ON public.crm_tasks(assigned_to);
CREATE INDEX idx_crm_tasks_due ON public.crm_tasks(due_date);
CREATE INDEX idx_crm_tasks_status ON public.crm_tasks(status);
CREATE INDEX idx_crm_activities_org ON public.crm_activities(organization_id);
CREATE INDEX idx_crm_activities_lead ON public.crm_activities(lead_id);
CREATE INDEX idx_crm_activities_family ON public.crm_activities(family_id);

-- Trigger to update updated_at
CREATE TRIGGER update_crm_leads_updated_at
BEFORE UPDATE ON public.crm_leads
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_referral_sources_updated_at
BEFORE UPDATE ON public.crm_referral_sources
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_crm_tasks_updated_at
BEFORE UPDATE ON public.crm_tasks
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
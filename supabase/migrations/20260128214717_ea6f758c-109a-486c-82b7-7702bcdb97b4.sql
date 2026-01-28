-- Create enum for integration providers
CREATE TYPE public.integration_provider AS ENUM ('google', 'microsoft');

-- Create table for storing OAuth tokens securely
CREATE TABLE public.crm_integrations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  provider integration_provider NOT NULL,
  access_token_encrypted TEXT,
  refresh_token_encrypted TEXT,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  scopes TEXT[],
  external_email TEXT,
  is_connected BOOLEAN NOT NULL DEFAULT false,
  last_sync_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, organization_id, provider)
);

-- Create table for sync activity log
CREATE TABLE public.crm_sync_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  integration_id UUID NOT NULL REFERENCES public.crm_integrations(id) ON DELETE CASCADE,
  sync_type TEXT NOT NULL, -- 'contact', 'calendar', 'email'
  entity_type TEXT NOT NULL, -- 'lead', 'task', 'activity'
  entity_id UUID,
  external_id TEXT, -- ID in Google/Microsoft
  status TEXT NOT NULL DEFAULT 'pending', -- 'pending', 'success', 'failed'
  error_message TEXT,
  synced_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.crm_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crm_sync_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for crm_integrations
CREATE POLICY "Users can view their own integrations"
ON public.crm_integrations
FOR SELECT
USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own integrations"
ON public.crm_integrations
FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own integrations"
ON public.crm_integrations
FOR UPDATE
USING (user_id = auth.uid());

CREATE POLICY "Users can delete their own integrations"
ON public.crm_integrations
FOR DELETE
USING (user_id = auth.uid());

-- Org admins can view all integrations in their org
CREATE POLICY "Org admins can view org integrations"
ON public.crm_integrations
FOR SELECT
USING (public.is_org_admin(organization_id, auth.uid()));

-- RLS Policies for crm_sync_log
CREATE POLICY "Users can view their sync logs"
ON public.crm_sync_log
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.crm_integrations ci
    WHERE ci.id = crm_sync_log.integration_id
    AND ci.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_crm_integrations_user ON public.crm_integrations(user_id);
CREATE INDEX idx_crm_integrations_org ON public.crm_integrations(organization_id);
CREATE INDEX idx_crm_sync_log_integration ON public.crm_sync_log(integration_id);
CREATE INDEX idx_crm_sync_log_entity ON public.crm_sync_log(entity_type, entity_id);

-- Trigger to update updated_at
CREATE TRIGGER update_crm_integrations_updated_at
BEFORE UPDATE ON public.crm_integrations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
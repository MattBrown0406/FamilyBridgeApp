-- Create table for provider admin requests to super admin
CREATE TABLE public.provider_admin_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID NOT NULL,
  request_type TEXT NOT NULL CHECK (request_type IN ('technical', 'improvement', 'general')),
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
  response TEXT,
  responded_by UUID,
  responded_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_admin_requests ENABLE ROW LEVEL SECURITY;

-- Organization members can view and create requests for their org
CREATE POLICY "Org members can view their org requests"
ON public.provider_admin_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = provider_admin_requests.organization_id
      AND om.user_id = auth.uid()
  )
);

CREATE POLICY "Org admins can create requests"
ON public.provider_admin_requests
FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid() AND
  EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = provider_admin_requests.organization_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);

-- Super admins can view all requests
CREATE POLICY "Super admins can view all requests"
ON public.provider_admin_requests
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Super admins can update requests (respond)
CREATE POLICY "Super admins can update requests"
ON public.provider_admin_requests
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create trigger to update updated_at
CREATE TRIGGER update_provider_admin_requests_updated_at
BEFORE UPDATE ON public.provider_admin_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_admin_requests;
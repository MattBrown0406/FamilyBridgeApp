-- Create table to track temporary moderator requests
CREATE TABLE public.temporary_moderator_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  assigned_moderator_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.temporary_moderator_requests ENABLE ROW LEVEL SECURITY;

-- Policy: Family members can view their family's requests
CREATE POLICY "Family members can view their requests"
ON public.temporary_moderator_requests
FOR SELECT
USING (
  public.is_family_member(family_id, auth.uid()) OR 
  assigned_moderator_id = auth.uid()
);

-- Policy: Family members can insert requests for their family
CREATE POLICY "Family members can request temporary moderator"
ON public.temporary_moderator_requests
FOR INSERT
WITH CHECK (
  public.is_family_member(family_id, auth.uid()) AND
  requested_by = auth.uid()
);

-- Policy: Assigned moderators can update status
CREATE POLICY "Assigned moderators can update requests"
ON public.temporary_moderator_requests
FOR UPDATE
USING (assigned_moderator_id = auth.uid());

-- Create index for efficient lookups
CREATE INDEX idx_temp_mod_requests_family_id ON public.temporary_moderator_requests(family_id);
CREATE INDEX idx_temp_mod_requests_assigned ON public.temporary_moderator_requests(assigned_moderator_id);
CREATE INDEX idx_temp_mod_requests_status ON public.temporary_moderator_requests(status);
-- Create table for family reactivation requests
CREATE TABLE public.family_reactivation_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'denied')),
  approved_by UUID,
  approved_at TIMESTAMP WITH TIME ZONE,
  reactivation_type TEXT CHECK (reactivation_type IN ('family_admin', 'provider_admin')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_reactivation_requests ENABLE ROW LEVEL SECURITY;

-- Family members can view requests for their families
CREATE POLICY "Family members can view reactivation requests"
ON public.family_reactivation_requests
FOR SELECT
TO authenticated
USING (
  public.is_family_member(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Any family member can create a reactivation request
CREATE POLICY "Family members can request reactivation"
ON public.family_reactivation_requests
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_family_member(family_id, auth.uid())
  AND requested_by = auth.uid()
);

-- Family admins/moderators and super admins can update requests
CREATE POLICY "Admins can update reactivation requests"
ON public.family_reactivation_requests
FOR UPDATE
TO authenticated
USING (
  public.is_family_admin_or_moderator(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_reactivation_requests_family ON public.family_reactivation_requests(family_id);
CREATE INDEX idx_reactivation_requests_status ON public.family_reactivation_requests(status);

-- Add comment
COMMENT ON TABLE public.family_reactivation_requests IS 'Tracks requests from family members to reactivate archived family groups';
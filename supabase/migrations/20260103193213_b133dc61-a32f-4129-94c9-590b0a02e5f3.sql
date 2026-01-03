-- Create table for paid moderator support purchases
CREATE TABLE public.paid_moderator_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  requested_by UUID NOT NULL,
  assigned_moderator_id UUID,
  status TEXT NOT NULL DEFAULT 'pending_payment',
  hours_purchased INTEGER NOT NULL DEFAULT 24,
  amount_paid NUMERIC NOT NULL DEFAULT 200.00,
  square_order_id TEXT,
  payment_completed_at TIMESTAMP WITH TIME ZONE,
  activated_at TIMESTAMP WITH TIME ZONE,
  expires_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.paid_moderator_requests ENABLE ROW LEVEL SECURITY;

-- Family members can view their family's paid requests
CREATE POLICY "Family members can view paid requests"
ON public.paid_moderator_requests
FOR SELECT
USING (is_family_member(family_id, auth.uid()) OR assigned_moderator_id = auth.uid());

-- Family members can create paid requests for their family
CREATE POLICY "Family members can create paid requests"
ON public.paid_moderator_requests
FOR INSERT
WITH CHECK (is_family_member(family_id, auth.uid()) AND requested_by = auth.uid());

-- Assigned moderators can update requests
CREATE POLICY "Assigned moderators can update paid requests"
ON public.paid_moderator_requests
FOR UPDATE
USING (assigned_moderator_id = auth.uid());

-- Create trigger for updated_at
CREATE TRIGGER update_paid_moderator_requests_updated_at
BEFORE UPDATE ON public.paid_moderator_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
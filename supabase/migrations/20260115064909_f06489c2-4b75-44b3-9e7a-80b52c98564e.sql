-- Create table to track subscription payment status
CREATE TABLE public.subscription_payment_status (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  entity_type TEXT NOT NULL CHECK (entity_type IN ('family', 'organization')),
  entity_id UUID NOT NULL,
  square_customer_id_hash TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'past_due', 'suspended', 'canceled')),
  last_payment_attempt TIMESTAMP WITH TIME ZONE,
  next_retry_at TIMESTAMP WITH TIME ZONE,
  failed_at TIMESTAMP WITH TIME ZONE,
  suspension_date TIMESTAMP WITH TIME ZONE,
  grace_period_ends_at TIMESTAMP WITH TIME ZONE,
  retry_count INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  card_last_four TEXT,
  payment_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(entity_type, entity_id)
);

-- Enable RLS
ALTER TABLE public.subscription_payment_status ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own subscription status"
ON public.subscription_payment_status
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  (entity_type = 'family' AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = subscription_payment_status.entity_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )) OR
  (entity_type = 'organization' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = subscription_payment_status.entity_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )) OR
  public.is_super_admin(auth.uid())
);

CREATE POLICY "Admins can update their subscription status"
ON public.subscription_payment_status
FOR UPDATE
TO authenticated
USING (
  user_id = auth.uid() OR
  (entity_type = 'family' AND EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = subscription_payment_status.entity_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'admin'
  )) OR
  (entity_type = 'organization' AND EXISTS (
    SELECT 1 FROM public.organization_members om
    WHERE om.organization_id = subscription_payment_status.entity_id
    AND om.user_id = auth.uid()
    AND om.role = 'admin'
  )) OR
  public.is_super_admin(auth.uid())
);

-- Create index for faster lookups
CREATE INDEX idx_subscription_payment_status_entity ON public.subscription_payment_status(entity_type, entity_id);
CREATE INDEX idx_subscription_payment_status_user ON public.subscription_payment_status(user_id);
CREATE INDEX idx_subscription_payment_status_next_retry ON public.subscription_payment_status(next_retry_at) WHERE status = 'past_due';

-- Create trigger for updating updated_at
CREATE TRIGGER update_subscription_payment_status_updated_at
BEFORE UPDATE ON public.subscription_payment_status
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
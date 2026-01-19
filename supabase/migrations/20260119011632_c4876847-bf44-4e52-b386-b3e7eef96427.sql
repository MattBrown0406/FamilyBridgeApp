-- Fix: Restrict subscription_payment_status to only the subscription owner and super admins
-- Family admins/moderators should not see detailed payment failure information

-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Users can view their own subscription status" ON public.subscription_payment_status;

-- Create a restrictive policy - only the subscription owner and super admins can see full details
CREATE POLICY "Only owner and super admins can view payment status"
ON public.subscription_payment_status
FOR SELECT
TO authenticated
USING (
  user_id = auth.uid() OR
  public.is_super_admin(auth.uid())
);

-- Create a limited view for family/org admins to know if there's a service issue
-- without exposing detailed payment information
CREATE OR REPLACE VIEW public.subscription_service_status 
WITH (security_invoker = on)
AS
SELECT 
  entity_type,
  entity_id,
  CASE 
    WHEN status = 'active' THEN 'active'::text
    WHEN status = 'canceled' THEN 'canceled'::text
    ELSE 'service_issue'::text
  END as service_status,
  -- Only show if there IS a grace period, not when it ends (privacy)
  CASE 
    WHEN grace_period_ends_at IS NOT NULL AND grace_period_ends_at > now() THEN true
    ELSE false
  END as in_grace_period
FROM public.subscription_payment_status;

-- Grant access to the view for authenticated users
GRANT SELECT ON public.subscription_service_status TO authenticated;

-- Create RLS-like function to check if user can see service status for an entity
CREATE OR REPLACE FUNCTION public.can_view_service_status(_entity_type text, _entity_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    -- Super admins can see all
    public.is_super_admin(auth.uid())
    OR
    -- For families: family admins/moderators can see limited status
    (_entity_type = 'family' AND EXISTS (
      SELECT 1 FROM public.family_members fm
      WHERE fm.family_id = _entity_id
      AND fm.user_id = auth.uid()
      AND fm.role IN ('admin', 'moderator')
    ))
    OR
    -- For organizations: org admins can see limited status  
    (_entity_type = 'organization' AND EXISTS (
      SELECT 1 FROM public.organization_members om
      WHERE om.organization_id = _entity_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
    ))
$$;
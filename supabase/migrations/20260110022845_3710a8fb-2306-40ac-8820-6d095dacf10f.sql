-- Drop the existing SELECT policy with the 1-hour window
DROP POLICY IF EXISTS "Restricted payment info access with time limit" ON public.payment_info;

-- Create improved policy with:
-- 1. Reduced time window from 1 hour to 5 minutes
-- 2. Additional check that payment hasn't been cancelled (paid_by_user_id still matches caller)
-- 3. Verify the request is still in approved state and paid_at is recent
CREATE POLICY "Restricted payment info access with time limit" 
ON public.payment_info 
FOR SELECT 
USING (
  -- Users can always view their own payment info
  (auth.uid() = user_id) 
  OR 
  -- Payers can view requester's payment info only during a 5-minute window
  (EXISTS (
    SELECT 1 FROM financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'::request_status
      AND fr.paid_by_user_id = auth.uid()
      AND fr.paid_at IS NOT NULL
      AND fr.payment_confirmed_at IS NULL
      -- Reduced from 1 hour to 5 minutes to minimize exposure window
      AND fr.paid_at > (now() - interval '5 minutes')
  ))
);

-- Create audit log table for payment info access
CREATE TABLE IF NOT EXISTS public.payment_info_access_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  accessed_by UUID NOT NULL,
  payment_info_user_id UUID NOT NULL,
  financial_request_id UUID,
  access_type TEXT NOT NULL DEFAULT 'view',
  accessed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT
);

-- Enable RLS on audit table
ALTER TABLE public.payment_info_access_audit ENABLE ROW LEVEL SECURITY;

-- Block all client access to audit logs (service role only)
CREATE POLICY "Block all client access to audit logs" 
ON public.payment_info_access_audit 
AS RESTRICTIVE
FOR ALL 
TO authenticated
USING (false)
WITH CHECK (false);

-- Block anonymous access to audit logs
CREATE POLICY "Block anonymous access to audit logs" 
ON public.payment_info_access_audit 
AS RESTRICTIVE
FOR ALL 
TO anon
USING (false)
WITH CHECK (false);
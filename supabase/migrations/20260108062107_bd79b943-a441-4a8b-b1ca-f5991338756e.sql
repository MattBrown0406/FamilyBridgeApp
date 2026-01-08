-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Restricted payment info access" ON public.payment_info;

-- Create a more restrictive policy that only allows access during active payment windows
-- Users can view payment info when:
-- 1. They own the payment info (their own account)
-- 2. They are a payer who marked a request as paid within the last hour AND payment not yet confirmed
CREATE POLICY "Restricted payment info access with time limit"
ON public.payment_info
FOR SELECT
USING (
  -- Owner can always see their own payment info
  auth.uid() = user_id
  OR
  -- Payers can see payment info only during active payment window (1 hour after marking paid)
  EXISTS (
    SELECT 1
    FROM public.financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fr.paid_by_user_id = auth.uid()
      AND fr.paid_at IS NOT NULL
      AND fr.payment_confirmed_at IS NULL
      AND fr.paid_at > (now() - interval '1 hour')
  )
);

-- Create an audit log table for payment info access
CREATE TABLE IF NOT EXISTS public.payment_info_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  payment_info_user_id uuid NOT NULL,
  accessed_by uuid NOT NULL,
  financial_request_id uuid,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  access_type text NOT NULL DEFAULT 'view'
);

-- Enable RLS on audit log
ALTER TABLE public.payment_info_access_log ENABLE ROW LEVEL SECURITY;

-- Only service role can insert/view audit logs (no client access)
CREATE POLICY "No public access to payment audit logs"
ON public.payment_info_access_log
FOR ALL
USING (false)
WITH CHECK (false);
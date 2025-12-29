-- Drop the existing overly permissive policy
DROP POLICY IF EXISTS "Payer can view payment info only during active payment" ON public.payment_info;

-- Create a more secure policy with time-limited access
-- Only allow viewing payment info when:
-- 1. There's an approved request where this user is the requester
-- 2. The request has been paid (paid_at is set) 
-- 3. Payment was marked within the last 1 hour (time-limited window)
-- 4. Payment has not been confirmed yet (still in active payment flow)
CREATE POLICY "Payer can view payment info during time-limited active payment" 
ON public.payment_info 
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fr.paid_by_user_id = auth.uid()
      AND fr.paid_at IS NOT NULL
      AND fr.payment_confirmed_at IS NULL
      -- Time limit: only within 1 hour of marking as paid
      AND fr.paid_at > (now() - interval '1 hour')
  )
);
-- Drop the current policy
DROP POLICY IF EXISTS "Only assigned payer can view requester payment info" ON public.payment_info;

-- Create a more restrictive policy that only allows payer access during active payment window
CREATE POLICY "Payer can view payment info only during active payment"
ON public.payment_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fr.paid_by_user_id = auth.uid()
      AND fr.payment_confirmed_at IS NULL  -- Only while payment is not yet confirmed
  )
);
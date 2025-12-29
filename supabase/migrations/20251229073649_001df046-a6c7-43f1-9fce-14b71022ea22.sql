-- Drop the overly permissive policy that allows all family members to view payment info
DROP POLICY IF EXISTS "Payers can view requester payment info for approved requests" ON public.payment_info;

-- Create a more restrictive policy that only allows the actual assigned payer to view payment info
CREATE POLICY "Only assigned payer can view requester payment info"
ON public.payment_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fr.paid_by_user_id = auth.uid()
  )
);
-- Remove the overly permissive family access policy
DROP POLICY IF EXISTS "Family members can view payment info" ON public.payment_info;

-- Create a more restrictive policy: only allow access via valid payment tokens
-- This allows payers to see requester's payment info only when there's an active approved request
CREATE POLICY "Payers can view requester payment info via token"
ON public.payment_info
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 
    FROM public.payment_access_tokens pat
    JOIN public.financial_requests fr ON fr.id = pat.financial_request_id
    WHERE pat.payer_user_id = auth.uid()
      AND fr.requester_id = payment_info.user_id
      AND pat.is_used = false
      AND pat.expires_at > now()
      AND fr.status = 'approved'
  )
);
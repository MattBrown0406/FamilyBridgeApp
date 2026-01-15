-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view payment info of family members for requests" ON public.payment_info;

-- Create a more restrictive policy that only allows access when there's an active financial request
-- Payment info is only visible when:
-- 1. It's the user's own payment info, OR
-- 2. There's a pending/approved financial request where:
--    a. The viewer is a potential payer (family member) and the payment_info owner is the requester, OR
--    b. The viewer is the requester and someone has pledged to pay (paid_by_user_id matches payment_info owner)
CREATE POLICY "Users can view payment info only for active requests"
ON public.payment_info
FOR SELECT
TO authenticated
USING (
  -- Own payment info
  auth.uid() = user_id 
  OR
  -- Active financial request where viewer needs to pay the payment_info owner (requester)
  EXISTS (
    SELECT 1 FROM public.financial_requests fr
    WHERE fr.requester_id = payment_info.user_id
    AND fr.status = 'approved'
    AND fr.paid_at IS NULL
    AND public.shares_family_with(auth.uid(), fr.requester_id)
  )
  OR
  -- Viewer is the requester and payment_info owner has committed to pay
  EXISTS (
    SELECT 1 FROM public.financial_requests fr
    WHERE fr.requester_id = auth.uid()
    AND fr.paid_by_user_id = payment_info.user_id
    AND fr.status = 'approved'
    AND fr.payment_confirmed_at IS NULL
  )
);
-- Remove the overly permissive moderator policy for payment_info
-- Moderators should not be able to view or update payment info for other family members

DROP POLICY IF EXISTS "Moderators can update family member payment info" ON public.payment_info;

-- Add a policy that allows moderators to only VIEW (not update) payment info 
-- for family members with APPROVED financial requests where payment is needed
-- This is more restrictive than before - only during active approved requests

CREATE POLICY "Moderators can view payment info for approved requests in their family"
ON public.payment_info
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.financial_requests fr
    JOIN public.family_members fm ON fm.family_id = fr.family_id
    WHERE fr.requester_id = payment_info.user_id
      AND fr.status = 'approved'
      AND fm.user_id = auth.uid()
      AND fm.role = 'moderator'
  )
);
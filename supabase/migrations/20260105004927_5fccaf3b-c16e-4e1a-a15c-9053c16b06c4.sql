-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Family members can view payment info for requests" ON public.payment_info;

-- Create a more restrictive policy: only owner can view their own info,
-- OR moderators can view payment info only for users with approved financial requests
CREATE POLICY "Restricted payment info access"
ON public.payment_info
FOR SELECT
USING (
  -- Users can always view their own payment info
  auth.uid() = user_id
  OR
  -- Moderators can view payment info only for approved financial requests in their family
  (
    EXISTS (
      SELECT 1 
      FROM financial_requests fr
      JOIN family_members fm ON fm.family_id = fr.family_id
      WHERE fr.requester_id = payment_info.user_id
        AND fr.status = 'approved'
        AND fm.user_id = auth.uid()
        AND fm.role = 'moderator'
    )
  )
);
-- Drop the vulnerable policy that allows access based on paid_by_user_id
DROP POLICY IF EXISTS "Restricted payment info access with time limit" ON public.payment_info;

-- Create a new strict policy: Users can ONLY view their own payment info
-- Payment links for others are accessed via the secure get_payment_links_with_token function
CREATE POLICY "Users can only view own payment info"
ON public.payment_info
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- The get_payment_links_with_token function (SECURITY DEFINER) already handles
-- secure access to other users' payment info via one-time tokens, bypassing RLS
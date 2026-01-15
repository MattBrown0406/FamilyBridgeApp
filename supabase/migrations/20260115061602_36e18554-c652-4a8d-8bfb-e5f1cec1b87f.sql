-- Drop existing SELECT policies that expose encrypted data
DROP POLICY IF EXISTS "Users can view their own payment info" ON public.payment_info;
DROP POLICY IF EXISTS "Users can select own payment info" ON public.payment_info;

-- Create a restrictive SELECT policy - users cannot directly SELECT their encrypted data
-- They must use the get_own_payment_info() function instead
CREATE POLICY "No direct SELECT on payment_info"
ON public.payment_info
FOR SELECT
TO authenticated
USING (false);

-- Keep INSERT/UPDATE/DELETE policies for users to manage their own payment info
DROP POLICY IF EXISTS "Users can insert their own payment info" ON public.payment_info;
CREATE POLICY "Users can insert their own payment info"
ON public.payment_info
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own payment info" ON public.payment_info;
CREATE POLICY "Users can update their own payment info"
ON public.payment_info
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own payment info" ON public.payment_info;
CREATE POLICY "Users can delete their own payment info"
ON public.payment_info
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Add comment explaining the security model
COMMENT ON TABLE public.payment_info IS 'Payment info is encrypted. Direct SELECT is blocked - use get_own_payment_info() RPC for decrypted access.';
-- Drop the existing restrictive policy if it exists
DROP POLICY IF EXISTS "Users can view own payment info" ON public.payment_info;

-- Create a proper permissive policy for SELECT
CREATE POLICY "Users can view own payment info" 
ON public.payment_info 
FOR SELECT 
TO authenticated
USING (auth.uid() = user_id);
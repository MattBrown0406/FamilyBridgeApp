-- Add restrictive policy to require authentication for payment_info table
CREATE POLICY "Require authentication for payment_info"
ON public.payment_info
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (true);
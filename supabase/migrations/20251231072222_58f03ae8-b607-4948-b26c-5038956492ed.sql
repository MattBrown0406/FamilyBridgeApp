-- Add explicit deny policy for anonymous/unauthenticated access to payment_info
-- This ensures only authenticated users can access payment info (their own)

CREATE POLICY "Block anonymous access"
ON public.payment_info
AS RESTRICTIVE
FOR SELECT
TO public
USING (auth.uid() IS NOT NULL);
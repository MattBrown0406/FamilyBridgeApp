-- Remove the overly permissive policy - the existing user-specific policies are sufficient
DROP POLICY IF EXISTS "Require authentication for payment_info" ON public.payment_info;
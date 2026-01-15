-- Remove the ineffective anonymous block policy
-- The authenticated-only policies already properly restrict access
DROP POLICY IF EXISTS "Block anonymous access to payment_info" ON public.payment_info;
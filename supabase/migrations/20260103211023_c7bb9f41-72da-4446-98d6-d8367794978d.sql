-- Drop the overly permissive "Block anonymous access" policy
-- This policy only checks if user is authenticated, not if they own the record
-- The existing "Users can view own payment info" policy correctly restricts access
DROP POLICY IF EXISTS "Block anonymous access" ON public.payment_info;
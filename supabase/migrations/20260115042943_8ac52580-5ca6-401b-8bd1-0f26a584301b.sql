-- Fix: Tighten payment_info access to use ONLY the secure token-based flow
-- 
-- Problem: Current policy allows viewing payment info for any approved request
-- Solution: Remove direct RLS access to payment info for family members
--           All access must go through the secure get_payment_links_with_token() function
--           which uses one-time tokens, rate limiting, and audit logging

-- Step 1: Drop the current overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view payment info only for active requests" ON public.payment_info;

-- Step 2: Create a more restrictive SELECT policy
-- Only allow users to view their OWN payment info directly
-- All other access must go through security definer functions with tokens
CREATE POLICY "Users can only view their own payment info"
ON public.payment_info
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Note: The existing security definer functions handle authorized access:
-- 1. get_own_payment_info() - lets users view their own unmasked payment info (with rate limiting and audit logging)
-- 2. generate_payment_access_token() - creates one-time token for payers (5 min expiry)
-- 3. get_payment_links_with_token() - retrieves payment links using one-time token (marks token used, logs access)
-- 
-- The payment_info_masked view provides masked data for display purposes
-- All actual payment info access is now token-gated with audit trails
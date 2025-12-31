-- Remove both SELECT policies from activation_codes
-- Users don't need to view activation codes - validation is done server-side
-- This prevents exposure of email addresses and Square customer IDs

DROP POLICY IF EXISTS "Block anonymous access" ON public.activation_codes;
DROP POLICY IF EXISTS "Users can view their own used activation codes" ON public.activation_codes;
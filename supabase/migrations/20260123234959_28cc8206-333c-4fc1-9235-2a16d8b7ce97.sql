-- Remove the token-based SELECT policy from payment_info table
-- All access to other users' payment info should ONLY go through the get_payment_links_with_token function
-- which is SECURITY DEFINER and handles validation, single-use consumption, and audit logging

DROP POLICY IF EXISTS "Payers can view requester payment info via token" ON public.payment_info;

-- Ensure the payment_info_masked view only shows has_payment_method booleans, not partial usernames
-- This prevents any partial username exposure through the view
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker = on)
AS
SELECT 
    id,
    user_id,
    created_at,
    updated_at,
    -- Only show boolean indicators, not partial usernames
    CASE WHEN venmo_username IS NOT NULL THEN true ELSE false END AS has_venmo,
    CASE WHEN paypal_username IS NOT NULL THEN true ELSE false END AS has_paypal,
    CASE WHEN cashapp_username IS NOT NULL THEN true ELSE false END AS has_cashapp
FROM public.payment_info;

-- Add comment explaining the security design
COMMENT ON VIEW public.payment_info_masked IS 
'Masked view that only reveals whether payment methods are configured, not partial usernames. 
All actual payment info access for payers goes through get_payment_links_with_token() RPC which 
enforces one-time tokens, expiration, rate limiting, and audit logging.';
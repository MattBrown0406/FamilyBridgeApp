-- Drop and recreate payment_info_masked view with security_invoker=on
-- This ensures RLS policies from the base payment_info table are enforced

DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker=on) AS
SELECT 
    id,
    user_id,
    created_at,
    updated_at,
    CASE
        WHEN venmo_username IS NOT NULL THEN concat(left(venmo_username, 2), '***')
        ELSE NULL::text
    END AS venmo_username,
    CASE
        WHEN paypal_username IS NOT NULL THEN concat(left(paypal_username, 2), '***')
        ELSE NULL::text
    END AS paypal_username,
    CASE
        WHEN cashapp_username IS NOT NULL THEN concat(left(cashapp_username, 2), '***')
        ELSE NULL::text
    END AS cashapp_username
FROM public.payment_info;

-- Add comment explaining security
COMMENT ON VIEW public.payment_info_masked IS 'Masked view of payment info with security_invoker=on. Access controlled by payment_info table RLS policies.';
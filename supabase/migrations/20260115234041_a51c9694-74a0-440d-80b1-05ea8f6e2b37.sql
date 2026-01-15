-- Drop and recreate the view with security_invoker=on
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker = on) AS
SELECT 
    id,
    user_id,
    CASE
        WHEN venmo_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS venmo_username,
    CASE
        WHEN paypal_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS paypal_username,
    CASE
        WHEN cashapp_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS cashapp_username,
    created_at,
    updated_at
FROM public.payment_info;

-- Grant access to authenticated users (RLS on payment_info will control actual access)
GRANT SELECT ON public.payment_info_masked TO authenticated;
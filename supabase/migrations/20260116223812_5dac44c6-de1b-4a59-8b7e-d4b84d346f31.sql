-- Drop and recreate the payment_info_masked view with security_invoker enabled
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker = on)
AS
SELECT 
    pi.id,
    pi.user_id,
    pi.created_at,
    pi.updated_at,
    CASE 
        WHEN pi.venmo_username IS NOT NULL THEN CONCAT(LEFT(pi.venmo_username, 2), '***')
        ELSE NULL 
    END as venmo_username,
    CASE 
        WHEN pi.paypal_username IS NOT NULL THEN CONCAT(LEFT(pi.paypal_username, 2), '***')
        ELSE NULL 
    END as paypal_username,
    CASE 
        WHEN pi.cashapp_username IS NOT NULL THEN CONCAT(LEFT(pi.cashapp_username, 2), '***')
        ELSE NULL 
    END as cashapp_username
FROM public.payment_info pi;

-- Revoke public access and grant only to authenticated users
REVOKE ALL ON public.payment_info_masked FROM anon;
REVOKE ALL ON public.payment_info_masked FROM public;
GRANT SELECT ON public.payment_info_masked TO authenticated;
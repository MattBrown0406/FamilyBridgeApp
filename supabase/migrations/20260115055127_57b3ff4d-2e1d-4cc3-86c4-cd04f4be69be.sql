-- Recreate view with security_invoker to inherit base table's RLS
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = on)
AS SELECT 
    id,
    code,
    is_used,
    used_by,
    used_at,
    expires_at,
    created_at,
    updated_at,
    CASE WHEN email_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END AS email_status,
    CASE WHEN square_customer_id_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END AS square_customer_status,
    CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END AS square_subscription_status,
    CASE WHEN purchase_ref_encrypted IS NOT NULL THEN '[ENCRYPTED]' ELSE NULL END AS purchase_ref_status
FROM activation_codes;
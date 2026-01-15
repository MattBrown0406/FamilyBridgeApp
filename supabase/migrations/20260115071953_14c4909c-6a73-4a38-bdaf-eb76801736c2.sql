-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Enable RLS on the underlying view (views inherit RLS from base tables, but we need explicit policies)
-- Since this is a view, we need to use security_barrier and ensure only super admins can access

-- Drop and recreate the view with security_barrier to ensure RLS is enforced
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
    id,
    code,
    created_at,
    updated_at,
    expires_at,
    is_used,
    used_at,
    used_by,
    CASE
        WHEN (email_encrypted IS NOT NULL) THEN 'encrypted'::text
        ELSE NULL::text
    END AS email_status,
    CASE
        WHEN (purchase_ref_encrypted IS NOT NULL) THEN 'encrypted'::text
        ELSE NULL::text
    END AS purchase_ref_status,
    CASE
        WHEN (square_customer_id_encrypted IS NOT NULL) THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_customer_status,
    CASE
        WHEN (square_subscription_id_encrypted IS NOT NULL) THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_subscription_status
FROM public.activation_codes
WHERE public.is_super_admin(auth.uid());

-- Add comment for documentation
COMMENT ON VIEW public.activation_codes_admin_view IS 'Admin-only view of activation codes. Access restricted to super admins via is_super_admin() check in view definition.';
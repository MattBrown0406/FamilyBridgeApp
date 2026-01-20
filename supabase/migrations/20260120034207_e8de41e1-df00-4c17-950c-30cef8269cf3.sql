-- Recreate the activation_codes_admin_view with proper access controls
-- Only super admins should be able to view activation codes
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_barrier = true) AS
SELECT 
    ac.id,
    ac.code,
    ac.created_at,
    ac.updated_at,
    ac.expires_at,
    ac.is_used,
    ac.used_at,
    ac.used_by,
    CASE
        WHEN ac.email_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS email_status,
    CASE
        WHEN ac.purchase_ref_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS purchase_ref_status,
    CASE
        WHEN ac.square_customer_id_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_customer_status,
    CASE
        WHEN ac.square_subscription_id_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_subscription_status
FROM public.activation_codes ac
WHERE public.is_super_admin(auth.uid());

-- Restrict access to authenticated users only (super admin check is in WHERE clause)
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;
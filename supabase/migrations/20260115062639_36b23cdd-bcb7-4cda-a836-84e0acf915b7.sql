-- Drop and recreate the view with built-in super admin check
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = on)
AS
SELECT 
  ac.id,
  ac.code,
  ac.is_used,
  ac.used_at,
  ac.used_by,
  ac.expires_at,
  ac.created_at,
  ac.updated_at,
  CASE WHEN ac.email_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as email_status,
  CASE WHEN ac.purchase_ref_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as purchase_ref_status,
  CASE WHEN ac.square_customer_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_customer_status,
  CASE WHEN ac.square_subscription_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_subscription_status
FROM public.activation_codes ac
WHERE public.is_super_admin(auth.uid());

-- Revoke all access and only grant to authenticated
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

COMMENT ON VIEW public.activation_codes_admin_view IS 'Admin view with built-in super admin check. Returns empty for non-super-admins.';
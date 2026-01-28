-- Drop and recreate the activation_codes_admin_view with proper security settings
DROP VIEW IF EXISTS public.activation_codes_admin_view;

-- Recreate view with security_invoker to enforce RLS from base table
CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  ac.id,
  ac.code,
  ac.is_used,
  ac.used_at,
  ac.used_by,
  ac.expires_at,
  ac.created_at,
  ac.updated_at,
  CASE WHEN ac.email_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS email_status,
  CASE WHEN ac.purchase_ref_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS purchase_ref_status,
  CASE WHEN ac.square_customer_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS square_customer_status,
  CASE WHEN ac.square_subscription_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL END AS square_subscription_status
FROM public.activation_codes ac
WHERE public.is_super_admin(auth.uid());

-- Revoke all access from anon and public roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon, public;

-- Grant SELECT only to authenticated users (RLS will further restrict to super admins)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add comment explaining the security pattern
COMMENT ON VIEW public.activation_codes_admin_view IS 
  'Secure admin view for activation codes. Only accessible by super admins. Uses security_invoker to enforce base table RLS and has WHERE clause restricting to super admins only.';
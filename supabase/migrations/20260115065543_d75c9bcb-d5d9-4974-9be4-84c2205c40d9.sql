-- Drop and recreate the view with security_invoker to use caller's permissions
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view 
WITH (security_invoker = true)
AS
SELECT 
  id,
  code,
  created_at,
  updated_at,
  expires_at,
  is_used,
  used_at,
  used_by,
  CASE WHEN email_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as email_status,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as purchase_ref_status,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_customer_status,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_subscription_status
FROM public.activation_codes;

-- The underlying activation_codes table already has RLS policies restricting to super admins only
-- With security_invoker = true, the view respects those policies

-- Revoke all from public/anon
REVOKE ALL ON public.activation_codes_admin_view FROM anon, public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;
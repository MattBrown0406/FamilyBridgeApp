-- Drop and recreate the view with security_invoker to enforce underlying RLS
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  id,
  code,
  is_used,
  used_at,
  used_by,
  expires_at,
  created_at,
  updated_at,
  CASE WHEN email_encrypted IS NOT NULL THEN 'present'::text ELSE NULL::text END AS email_status,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN 'present'::text ELSE NULL::text END AS purchase_ref_status,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL::text END AS square_customer_status,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN 'present'::text ELSE NULL::text END AS square_subscription_status
FROM public.activation_codes;

-- Recreate the activation_codes_admin_view with proper security settings
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = on, security_barrier = true) AS
SELECT 
  id,
  (LEFT(code, 4) || '-****-' || RIGHT(code, 4)) AS code_masked,
  is_used,
  used_at,
  used_by,
  expires_at,
  created_at,
  updated_at,
  CASE WHEN email_encrypted IS NOT NULL THEN 'present' ELSE NULL END AS has_email,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN 'present' ELSE NULL END AS has_purchase_ref,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN 'present' ELSE NULL END AS has_square_customer,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN 'present' ELSE NULL END AS has_subscription
FROM public.activation_codes
WHERE public.is_super_admin(auth.uid());

-- Revoke all access from anonymous and public roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;

-- Grant SELECT only to authenticated users (the WHERE clause further restricts to super admins)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add a comment documenting the security model
COMMENT ON VIEW public.activation_codes_admin_view IS 
'Admin view for activation codes - access restricted to super admins via WHERE clause. 
Masks sensitive fields (code partially masked, encrypted fields show only presence status). 
Anonymous access blocked via REVOKE.';

-- Drop and recreate the view with security_invoker enabled
-- This ensures the view respects the base table's RLS policies
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = on)
AS
SELECT 
  id,
  code,
  is_used,
  used_by,
  used_at,
  expires_at,
  created_at,
  updated_at,
  CASE WHEN email_encrypted IS NOT NULL THEN '[ENCRYPTED]'::text ELSE NULL::text END AS email_status,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN '[ENCRYPTED]'::text ELSE NULL::text END AS square_customer_status,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN '[ENCRYPTED]'::text ELSE NULL::text END AS square_subscription_status,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN '[ENCRYPTED]'::text ELSE NULL::text END AS purchase_ref_status
FROM public.activation_codes;

-- Revoke all permissions from public and anon
REVOKE ALL ON public.activation_codes_admin_view FROM PUBLIC;
REVOKE ALL ON public.activation_codes_admin_view FROM anon;

-- Grant select only to authenticated (RLS on base table will enforce super admin check)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add comment for documentation
COMMENT ON VIEW public.activation_codes_admin_view IS 
'Admin view for activation codes. Access controlled by RLS on activation_codes table (super admins only).';
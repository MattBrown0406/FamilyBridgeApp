-- Enable RLS on the admin view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Since views with security_invoker inherit RLS from underlying tables,
-- and activation_codes already has super admin only policies,
-- we need to ensure the view itself is also protected.
-- Create a security barrier view instead for better protection.

-- Drop the existing view
DROP VIEW IF EXISTS public.activation_codes_admin_view;

-- Recreate as a security barrier view with explicit super admin check
CREATE VIEW public.activation_codes_admin_view 
WITH (security_barrier = true)
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
FROM public.activation_codes
WHERE public.is_super_admin(auth.uid());

-- Revoke all permissions from public/anon and grant only to authenticated
REVOKE ALL ON public.activation_codes_admin_view FROM anon, public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;
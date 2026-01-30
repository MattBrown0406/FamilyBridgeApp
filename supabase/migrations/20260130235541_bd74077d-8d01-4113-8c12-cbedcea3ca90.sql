-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Note: Views inherit RLS from their underlying tables when security_invoker is on.
-- Since activation_codes has USING (false) for SELECT, we need a different approach.
-- We'll recreate the view with security_barrier and add explicit RLS.

-- First, drop the existing view
DROP VIEW IF EXISTS public.activation_codes_admin_view;

-- Recreate the view with security_barrier to prevent data leakage
CREATE VIEW public.activation_codes_admin_view
WITH (security_barrier = true, security_invoker = false)
AS
SELECT 
  id,
  -- Mask the code: show first 4 and last 4 chars
  LEFT(code, 4) || '-****-' || RIGHT(code, 4) as code_masked,
  is_used,
  used_at,
  used_by,
  expires_at,
  created_at,
  updated_at,
  -- Show presence of encrypted fields without exposing values
  CASE WHEN email_encrypted IS NOT NULL THEN 'present' ELSE NULL END as has_email,
  CASE WHEN purchase_ref_encrypted IS NOT NULL THEN 'present' ELSE NULL END as has_purchase_ref,
  CASE WHEN square_customer_id_encrypted IS NOT NULL THEN 'present' ELSE NULL END as has_square_customer,
  CASE WHEN square_subscription_id_encrypted IS NOT NULL THEN 'present' ELSE NULL END as has_subscription
FROM public.activation_codes
WHERE public.is_super_admin(auth.uid());

-- Grant access only to authenticated users (the view's WHERE clause handles the super admin check)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Revoke access from anon and public roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;

-- Add a comment explaining the security model
COMMENT ON VIEW public.activation_codes_admin_view IS 
'Admin-only view of activation codes with masked sensitive data. Access restricted to super admins via is_super_admin() check in the view definition. Uses security_barrier to prevent data leakage through predicate pushdown.';
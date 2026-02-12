-- Remove super admin direct access to raw payment info
-- Super admins should use the masked view or token-based access like everyone else
DROP POLICY IF EXISTS "Super admins can view all payment info" ON public.payment_info;

-- Also remove super admin access from the masked view
-- They don't need to see which payment methods other users have set up
CREATE OR REPLACE VIEW public.payment_info_masked
WITH (security_barrier = true, security_invoker = off)
AS
SELECT 
  id,
  user_id,
  created_at,
  updated_at,
  CASE WHEN venmo_username IS NOT NULL THEN true ELSE false END AS has_venmo,
  CASE WHEN paypal_username IS NOT NULL THEN true ELSE false END AS has_paypal,
  CASE WHEN cashapp_username IS NOT NULL THEN true ELSE false END AS has_cashapp
FROM payment_info pi
WHERE 
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() AND fm2.user_id = pi.user_id
  );

-- Ensure permissions are correct
REVOKE ALL ON public.payment_info_masked FROM anon, public;
GRANT SELECT ON public.payment_info_masked TO authenticated;
-- Drop and recreate the view with security_invoker to inherit RLS from base table
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker=on, security_barrier=true) AS
SELECT 
  pi.id,
  pi.user_id,
  pi.created_at,
  pi.updated_at,
  CASE WHEN pi.venmo_username IS NOT NULL THEN true ELSE false END AS has_venmo,
  CASE WHEN pi.paypal_username IS NOT NULL THEN true ELSE false END AS has_paypal,
  CASE WHEN pi.cashapp_username IS NOT NULL THEN true ELSE false END AS has_cashapp
FROM public.payment_info pi
WHERE 
  -- User can see their own payment info
  pi.user_id = auth.uid()
  -- Or user is in the same family as the payment info owner
  OR EXISTS (
    SELECT 1 FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = pi.user_id
  )
  -- Or user is a super admin
  OR public.is_super_admin(auth.uid());

-- Grant access only to authenticated users
REVOKE ALL ON public.payment_info_masked FROM anon, public;
GRANT SELECT ON public.payment_info_masked TO authenticated;
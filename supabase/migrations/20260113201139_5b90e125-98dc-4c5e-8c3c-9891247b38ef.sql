-- Fix the SECURITY DEFINER view issue by recreating with SECURITY INVOKER
DROP VIEW IF EXISTS public.payment_info_masked;

-- Recreate the view with SECURITY INVOKER (which is the default, but let's be explicit)
CREATE VIEW public.payment_info_masked 
WITH (security_invoker = true)
AS
SELECT 
  id,
  user_id,
  CASE WHEN venmo_username IS NOT NULL THEN '••••••' ELSE NULL END as venmo_username,
  CASE WHEN paypal_username IS NOT NULL THEN '••••••' ELSE NULL END as paypal_username,
  CASE WHEN cashapp_username IS NOT NULL THEN '••••••' ELSE NULL END as cashapp_username,
  created_at,
  updated_at
FROM public.payment_info;

-- Grant access to the view
GRANT SELECT ON public.payment_info_masked TO authenticated;
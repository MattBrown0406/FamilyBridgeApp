-- Drop and recreate the payment_info_masked view with security controls
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked 
WITH (security_barrier = true, security_invoker = true) AS
SELECT 
    id,
    user_id,
    CASE
        WHEN (venmo_username IS NOT NULL) THEN '••••••'::text
        ELSE NULL::text
    END AS venmo_username,
    CASE
        WHEN (paypal_username IS NOT NULL) THEN '••••••'::text
        ELSE NULL::text
    END AS paypal_username,
    CASE
        WHEN (cashapp_username IS NOT NULL) THEN '••••••'::text
        ELSE NULL::text
    END AS cashapp_username,
    created_at,
    updated_at
FROM public.payment_info
WHERE 
    -- User can only see their own masked payment info
    user_id = auth.uid()
    -- Or super admins can see all
    OR public.is_super_admin(auth.uid());

-- Add comment for documentation
COMMENT ON VIEW public.payment_info_masked IS 'Masked payment info view. Users can only see their own masked data. Super admins can see all masked data. Actual usernames are never exposed through this view.';
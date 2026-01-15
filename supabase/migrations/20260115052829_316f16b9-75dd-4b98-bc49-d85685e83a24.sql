-- Drop and recreate the payment_info_masked view with security_invoker enabled
DROP VIEW IF EXISTS public.payment_info_masked;

CREATE VIEW public.payment_info_masked
WITH (security_invoker = on)
AS
SELECT 
    id,
    user_id,
    CASE
        WHEN venmo_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS venmo_username,
    CASE
        WHEN paypal_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS paypal_username,
    CASE
        WHEN cashapp_username IS NOT NULL THEN '••••••'::text
        ELSE NULL::text
    END AS cashapp_username,
    created_at,
    updated_at
FROM public.payment_info;

-- Revoke all permissions from public and anon
REVOKE ALL ON public.payment_info_masked FROM PUBLIC;
REVOKE ALL ON public.payment_info_masked FROM anon;

-- Grant select only to authenticated users (RLS on base table will enforce user_id check)
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Add a policy to block anonymous access to the base table
DROP POLICY IF EXISTS "Block anonymous access to payment_info" ON public.payment_info;
CREATE POLICY "Block anonymous access to payment_info"
ON public.payment_info
FOR SELECT
TO anon
USING (false);

-- Add comment for documentation
COMMENT ON VIEW public.payment_info_masked IS 
'Masked view of payment info. Access controlled by RLS on payment_info table (users can only see their own records).';
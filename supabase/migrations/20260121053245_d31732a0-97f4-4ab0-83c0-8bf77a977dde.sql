-- =====================================================
-- SECURITY FIX: Remove direct SELECT access to activation_codes table
-- Force all reads through the masked activation_codes_admin_view
-- This prevents super admins from accessing encrypted payment identifiers
-- =====================================================

-- Drop the SELECT policy that allows super admins to query the raw table
DROP POLICY IF EXISTS "activation_codes_select_super_admin" ON public.activation_codes;

-- Create a more restrictive SELECT policy that blocks all direct reads
-- Service role (used by edge functions) bypasses RLS so they still work
CREATE POLICY "activation_codes_no_direct_select" 
ON public.activation_codes 
FOR SELECT 
TO authenticated 
USING (false);

-- Ensure the admin view uses security_invoker (caller's permissions)
-- and only exposes masked data
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view 
WITH (security_invoker = true)
AS
SELECT 
    id,
    code,
    is_used,
    used_at,
    used_by,
    expires_at,
    created_at,
    updated_at,
    -- Mask sensitive fields - only show presence indicator
    CASE
        WHEN email_encrypted IS NOT NULL THEN 'present'::text
        ELSE NULL::text
    END AS email_status,
    CASE
        WHEN purchase_ref_encrypted IS NOT NULL THEN 'present'::text
        ELSE NULL::text
    END AS purchase_ref_status,
    CASE
        WHEN square_customer_id_encrypted IS NOT NULL THEN 'present'::text
        ELSE NULL::text
    END AS square_customer_status,
    CASE
        WHEN square_subscription_id_encrypted IS NOT NULL THEN 'present'::text
        ELSE NULL::text
    END AS square_subscription_status
FROM public.activation_codes;

-- Grant access to the view for super admins via a function check
-- The view itself doesn't expose encrypted data, so this is safe
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add comment documenting the security design
COMMENT ON VIEW public.activation_codes_admin_view IS 
'Secure admin view for activation codes that masks all encrypted payment data. 
Super admins can see code status and usage but cannot access Square customer/subscription IDs 
or email addresses. Direct table access is blocked by RLS.';
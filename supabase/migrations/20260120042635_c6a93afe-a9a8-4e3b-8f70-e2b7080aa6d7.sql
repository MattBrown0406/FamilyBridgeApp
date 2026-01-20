-- Fix: Recreate activation_codes_admin_view with security_invoker to properly enforce RLS
-- The view already has a WHERE clause checking is_super_admin, but we need security_invoker
-- for proper RLS enforcement

DROP VIEW IF EXISTS public.activation_codes_admin_view;

-- Recreate with security_invoker = true (requires the base table to allow super admin access)
-- First, we need to update the base table RLS to allow super admins to read (through the view)
DROP POLICY IF EXISTS "No direct table access - use admin view" ON public.activation_codes;

-- Create policy that allows super admins to read (will be used by security_invoker view)
CREATE POLICY "Super admins can read via view"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Recreate the view with security_invoker = true
-- This means the view will use the permissions of the querying user, not the view creator
CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = true, security_barrier = true) AS
SELECT 
    id,
    code,
    created_at,
    updated_at,
    expires_at,
    is_used,
    used_at,
    used_by,
    CASE
        WHEN email_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS email_status,
    CASE
        WHEN purchase_ref_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS purchase_ref_status,
    CASE
        WHEN square_customer_id_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_customer_status,
    CASE
        WHEN square_subscription_id_encrypted IS NOT NULL THEN 'encrypted'::text
        ELSE NULL::text
    END AS square_subscription_status
FROM public.activation_codes;

-- Restrict view access to authenticated users only
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add comment explaining the security model
COMMENT ON VIEW public.activation_codes_admin_view IS 
'SECURITY: Uses security_invoker=true so queries run with caller permissions.
Only super admins can access due to RLS policy on activation_codes table.
Sensitive encrypted fields are masked, showing only status indicators.';
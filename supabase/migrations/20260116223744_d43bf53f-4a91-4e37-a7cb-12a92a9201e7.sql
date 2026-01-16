-- Drop and recreate the view with security_invoker enabled
-- This makes the view respect the RLS policies of the underlying tables
DROP VIEW IF EXISTS public.activation_codes_admin_view;

CREATE VIEW public.activation_codes_admin_view
WITH (security_invoker = on)
AS
SELECT 
    ac.id,
    ac.code,
    ac.created_at,
    ac.updated_at,
    ac.expires_at,
    ac.is_used,
    ac.used_at,
    ac.used_by,
    CASE WHEN ac.email_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as email_status,
    CASE WHEN ac.purchase_ref_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as purchase_ref_status,
    CASE WHEN ac.square_customer_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_customer_status,
    CASE WHEN ac.square_subscription_id_encrypted IS NOT NULL THEN 'encrypted' ELSE NULL END as square_subscription_status
FROM public.activation_codes ac;

-- Grant access only to authenticated users (RLS on activation_codes will handle the rest)
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Ensure the underlying activation_codes table has proper RLS
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

-- Drop existing policies and create super admin only policy for SELECT
DROP POLICY IF EXISTS "Super admins can view activation codes" ON public.activation_codes;

CREATE POLICY "Super admins can view activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
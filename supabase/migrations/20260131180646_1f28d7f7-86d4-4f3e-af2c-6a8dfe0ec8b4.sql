-- Secure the payment_info_masked view
-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.payment_info_masked FROM anon;
REVOKE ALL ON public.payment_info_masked FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.payment_info_masked IS 
'Masked view of payment info showing only boolean indicators (has_venmo, has_paypal, has_cashapp).
SECURITY: Raw payment handles are never exposed. Only shows existence flags.
ACCESS: Restricted to authenticated users only. Actual payment links require one-time tokens via get_payment_links_with_token().
PERMISSIONS: Explicit REVOKE from anon/public, GRANT only to authenticated.';
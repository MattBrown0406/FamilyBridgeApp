
-- Harden payment_info_masked view permissions
-- Revoke all access from anonymous and public roles
REVOKE ALL ON public.payment_info_masked FROM anon;
REVOKE ALL ON public.payment_info_masked FROM public;

-- Grant SELECT only to authenticated users
GRANT SELECT ON public.payment_info_masked TO authenticated;

-- Also ensure the underlying table has proper permissions
REVOKE ALL ON public.payment_info FROM anon;
REVOKE ALL ON public.payment_info FROM public;

-- Update documentation
COMMENT ON VIEW public.payment_info_masked IS 
'Masked view of payment info showing only boolean indicators (has_venmo, has_paypal, has_cashapp).
SECURITY: Raw payment handles are NEVER exposed through this view. Only shows existence flags.
ACCESS: Restricted to authenticated users who are: (1) the owner, (2) family members, or (3) super admins.
PERMISSIONS: Explicit REVOKE from anon/public, GRANT SELECT only to authenticated.
RAW ACCESS: Actual payment links require one-time tokens via get_payment_links_with_token() function with audit logging.';

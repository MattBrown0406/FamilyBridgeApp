-- Secure the subscription_service_status view
-- Revoke all permissions from anonymous and public roles
REVOKE ALL ON public.subscription_service_status FROM anon;
REVOKE ALL ON public.subscription_service_status FROM public;

-- Grant SELECT only to authenticated users (view enforces owner/super-admin filtering)
GRANT SELECT ON public.subscription_service_status TO authenticated;

-- Add security documentation
COMMENT ON VIEW public.subscription_service_status IS 
'Secure view for subscription and payment status information.
SECURITY: Shows grace periods, payment status, and subscription details.
ACCESS: Restricted to authenticated users. View filters to account owners and super admins only.
PERMISSIONS: Explicit REVOKE from anon/public, GRANT only to authenticated.';
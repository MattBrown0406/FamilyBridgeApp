-- Ensure proper access controls on activation_codes_admin_view
-- The view uses security_invoker=on, so it respects the base table's RLS
-- which only allows super admins to SELECT

-- Revoke all permissions from public and anon roles
REVOKE ALL ON public.activation_codes_admin_view FROM PUBLIC;
REVOKE ALL ON public.activation_codes_admin_view FROM anon;

-- Grant select to authenticated - actual access controlled by base table RLS (super admin only)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;
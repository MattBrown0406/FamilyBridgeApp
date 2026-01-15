-- Ensure proper access controls on activation_codes_admin_view
-- Revoke all permissions from public and anon
REVOKE ALL ON public.activation_codes_admin_view FROM PUBLIC;
REVOKE ALL ON public.activation_codes_admin_view FROM anon;

-- Grant select only to authenticated users (RLS on base table enforces super admin check)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Update comment for documentation
COMMENT ON VIEW public.activation_codes_admin_view IS 
'Admin view for activation codes. Uses security_invoker=on so access is controlled by RLS on activation_codes table (super admins only).';
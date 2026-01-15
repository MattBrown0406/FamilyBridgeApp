-- Ensure the view uses security invoker to respect RLS on base table
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Revoke ALL access from public and anon roles
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
REVOKE ALL ON public.activation_codes_admin_view FROM authenticated;

-- Only grant SELECT to authenticated users (RLS on base table will filter)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

-- Add comment documenting security
COMMENT ON VIEW public.activation_codes_admin_view IS 'Administrative view - access controlled by RLS on activation_codes base table. Only super admins can view.';
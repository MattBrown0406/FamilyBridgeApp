
-- Add explicit permission controls to activation_codes_admin_view
-- The view already has WHERE is_super_admin(auth.uid()) so non-admins get 0 rows
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;

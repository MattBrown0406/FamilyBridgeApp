-- Ensure RLS is enabled on the activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Force RLS for table owners as well (prevents bypassing)
ALTER TABLE public.activation_codes FORCE ROW LEVEL SECURITY;

-- Drop any existing permissive policies that might allow public access
DROP POLICY IF EXISTS "Enable read access for all users" ON public.activation_codes;
DROP POLICY IF EXISTS "Public read access" ON public.activation_codes;

-- Revoke direct access from anon and public roles on the view
REVOKE ALL ON public.activation_codes_admin_view FROM anon;
REVOKE ALL ON public.activation_codes_admin_view FROM public;

-- Grant access only to authenticated users (who must still pass RLS)
GRANT SELECT ON public.activation_codes_admin_view TO authenticated;
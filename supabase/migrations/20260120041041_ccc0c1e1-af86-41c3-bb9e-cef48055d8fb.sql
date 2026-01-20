-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = true);

-- Create policy to restrict access to super admins only
CREATE POLICY "Only super admins can view activation codes admin view"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Also ensure the underlying activation_codes table has proper RLS
-- Drop any overly permissive policies if they exist and recreate restrictive ones
DROP POLICY IF EXISTS "Super admins can view all activation codes" ON public.activation_codes;

CREATE POLICY "Super admins can view all activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));
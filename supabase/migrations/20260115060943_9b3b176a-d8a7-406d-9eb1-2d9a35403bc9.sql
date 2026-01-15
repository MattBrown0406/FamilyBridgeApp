-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Create policy to restrict access to super admins only
CREATE POLICY "Only super admins can view activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Also ensure the base activation_codes table has proper admin-only access for all operations
CREATE POLICY "Only super admins can insert activation codes"
ON public.activation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can update activation codes"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can delete activation codes"
ON public.activation_codes
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));
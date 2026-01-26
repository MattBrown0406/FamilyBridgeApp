-- Add SELECT policy for super admins to view activation codes
-- This allows super admins to use the activation_codes_admin_view
-- which already masks sensitive data and has security_invoker=true

CREATE POLICY "activation_codes_select_super_admin"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));
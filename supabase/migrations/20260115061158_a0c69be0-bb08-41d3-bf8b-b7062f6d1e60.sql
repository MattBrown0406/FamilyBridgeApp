-- Drop all existing policies on activation_codes to start fresh
DROP POLICY IF EXISTS "Only super admins can view activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Only super admins can delete activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Block anonymous access" ON public.activation_codes;
DROP POLICY IF EXISTS "Block non-admin access" ON public.activation_codes;

-- Create single consolidated policy for super admin access only
CREATE POLICY "Super admins have full access to activation codes"
ON public.activation_codes
FOR ALL
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));
-- Drop all existing policies on activation_codes to avoid conflicts
DROP POLICY IF EXISTS "Super admins can insert activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can update activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can delete activation codes" ON public.activation_codes;

-- Recreate the policies
CREATE POLICY "Super admins can insert activation codes"
ON public.activation_codes
FOR INSERT
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can update activation codes"
ON public.activation_codes
FOR UPDATE
USING (public.is_super_admin(auth.uid()));

CREATE POLICY "Super admins can delete activation codes"
ON public.activation_codes
FOR DELETE
USING (public.is_super_admin(auth.uid()));
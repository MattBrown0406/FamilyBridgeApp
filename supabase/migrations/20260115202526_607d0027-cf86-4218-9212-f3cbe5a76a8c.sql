-- Enable RLS on the activation_codes_admin_view
ALTER VIEW public.activation_codes_admin_view SET (security_invoker = on);

-- Note: Views inherit RLS from underlying tables, but we need to ensure the view itself is protected
-- Since this is a view, we'll add RLS to the underlying activation_codes table if not already done

-- First, ensure RLS is enabled on activation_codes table
ALTER TABLE public.activation_codes ENABLE ROW LEVEL SECURITY;

-- Drop any existing overly permissive policies on activation_codes
DROP POLICY IF EXISTS "Allow public read of activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Public can read activation codes" ON public.activation_codes;

-- Create policy to restrict activation_codes to super admins only for SELECT
CREATE POLICY "Only super admins can view activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create policy for super admins to manage activation codes
CREATE POLICY "Only super admins can insert activation codes"
ON public.activation_codes
FOR INSERT
TO authenticated
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can update activation codes"
ON public.activation_codes
FOR UPDATE
TO authenticated
USING (public.is_super_admin(auth.uid()))
WITH CHECK (public.is_super_admin(auth.uid()));

CREATE POLICY "Only super admins can delete activation codes"
ON public.activation_codes
FOR DELETE
TO authenticated
USING (public.is_super_admin(auth.uid()));
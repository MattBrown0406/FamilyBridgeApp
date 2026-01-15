-- Fix activation_codes table RLS policies
-- Problem: Only super admins can view, but code owners should see their own codes too

-- Drop the overly permissive super admin policy
DROP POLICY IF EXISTS "Only super admins can view activation codes directly" ON public.activation_codes;

-- Create policy: Super admins can view all activation codes
CREATE POLICY "Super admins can view all activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Create policy: Users can view only their own used activation code
CREATE POLICY "Users can view their own activation code"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (used_by = auth.uid());
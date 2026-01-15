-- Remove the policy that allows users to view their own activation codes directly
-- Users should use get_user_activation_status() function instead which only returns safe data
DROP POLICY IF EXISTS "Users can view their own activation code" ON public.activation_codes;

-- Ensure we have a comprehensive block on authenticated SELECT that isn't super admin
-- First drop and recreate to ensure clean state
DROP POLICY IF EXISTS "Block authenticated non-admin SELECT" ON public.activation_codes;

CREATE POLICY "Block authenticated non-admin SELECT"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (is_super_admin(auth.uid()));

-- Update super admin policy to be explicit
DROP POLICY IF EXISTS "Super admins can view all activation codes" ON public.activation_codes;
-- Fix activation_codes policies - the current RESTRICTIVE deny-all policies 
-- are blocking the legitimate PERMISSIVE policies from working correctly.
-- 
-- Solution: Use only PERMISSIVE policies for SELECT with proper conditions,
-- and keep RESTRICTIVE policies only for blocking INSERT/UPDATE/DELETE from clients

-- Drop all existing SELECT policies
DROP POLICY IF EXISTS "Deny all SELECT access" ON public.activation_codes;
DROP POLICY IF EXISTS "Super admins can view all activation codes" ON public.activation_codes;
DROP POLICY IF EXISTS "Users can view their own used activation codes" ON public.activation_codes;

-- Create a single consolidated SELECT policy
-- Only super admins or users who used the code can view
CREATE POLICY "Authorized users can view activation codes"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (
  public.is_super_admin(auth.uid()) 
  OR used_by = auth.uid()
);

-- Block anonymous SELECT access
CREATE POLICY "Block anonymous SELECT access"
ON public.activation_codes
AS RESTRICTIVE
FOR SELECT
TO anon
USING (false);
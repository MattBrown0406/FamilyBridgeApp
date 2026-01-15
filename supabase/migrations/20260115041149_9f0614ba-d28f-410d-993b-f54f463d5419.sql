-- Fix: Separate activation status viewing from sensitive payment data
-- 
-- Problem: Users can view their own activation codes including encrypted payment data
-- Solution: 
-- 1. Drop the current permissive SELECT policy
-- 2. Create a security definer function that returns ONLY status info (no encrypted data)
-- 3. Users access their status via the function, not direct table access
-- 4. Only super admins can access the full table directly

-- Step 1: Drop the current SELECT policy that exposes all columns
DROP POLICY IF EXISTS "Authorized users can view activation codes" ON public.activation_codes;

-- Step 2: Create a security definer function for users to check their activation status
-- This only returns safe, non-sensitive fields
CREATE OR REPLACE FUNCTION public.get_user_activation_status()
RETURNS TABLE (
  code_exists boolean,
  is_used boolean,
  used_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_expired boolean
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT 
    true as code_exists,
    ac.is_used,
    ac.used_at,
    ac.expires_at,
    (ac.expires_at IS NOT NULL AND ac.expires_at < now()) as is_expired
  FROM public.activation_codes ac
  WHERE ac.used_by = auth.uid()
  LIMIT 1;
$$;

-- Step 3: Create policy that ONLY allows super admins direct table access
-- Regular users must use the get_user_activation_status() function
CREATE POLICY "Only super admins can view activation codes directly"
ON public.activation_codes
FOR SELECT
TO authenticated
USING (public.is_super_admin(auth.uid()));

-- Keep the anonymous block policy
-- (already exists: "Block anonymous SELECT access")
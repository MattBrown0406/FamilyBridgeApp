-- Fix profiles table RLS to prevent unauthorized access
-- Profile visibility should be restricted to:
-- 1. Users can always see their own profile
-- 2. Super admins can see all profiles (for administration)
-- 3. All other profile lookups go through the get-profiles edge function

-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Profiles visible to permanent members only" ON public.profiles;

-- Drop the org staff policy as this is now handled by edge function
DROP POLICY IF EXISTS "Org staff can view profiles of org family members" ON public.profiles;

-- Create a more restrictive SELECT policy
-- Users can only see their own profile and super admins can see all
CREATE POLICY "Users can view own profile or super admins can view all"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.is_super_admin(auth.uid())
);

-- Add a comment explaining the security model
COMMENT ON TABLE public.profiles IS 'User profiles with restricted RLS. Direct SELECT limited to own profile or super admin. Family/org member profile lookups must use the get-profiles edge function which enforces proper authorization checks.';
-- Drop the restrictive policies on profiles table for SELECT
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of family members" ON public.profiles;

-- Create a proper PERMISSIVE SELECT policy that allows authenticated users to view
-- their own profile or profiles of family members they share families with
-- This policy inherently blocks anonymous access since auth.uid() returns NULL for anonymous users
CREATE POLICY "Authenticated users can view family profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR shares_family_with(auth.uid(), id)
);
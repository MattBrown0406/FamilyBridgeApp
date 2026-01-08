-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Users can view profiles with verified relationships" ON public.profiles;

-- Create a more restrictive policy that only allows viewing profiles in the current context
-- Users can only see:
-- 1. Their own profile
-- 2. Profiles of users in the SAME specific family (not across families)
-- Organization staff access is intentionally removed as it's not needed for the app's functionality
CREATE POLICY "Users can view own profile and direct family members"
ON public.profiles
FOR SELECT
USING (
  auth.uid() = id
  OR EXISTS (
    SELECT 1
    FROM family_members fm1
    INNER JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
    AND fm2.user_id = profiles.id
    AND fm1.user_id <> fm2.user_id
  )
);
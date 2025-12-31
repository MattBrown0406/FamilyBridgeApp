-- Remove the redundant "Block anonymous access" policy
-- The existing "Users can view profiles of family members" policy already requires authentication
-- via auth.uid() checks - anonymous users will fail these conditions
DROP POLICY IF EXISTS "Block anonymous access" ON public.profiles;
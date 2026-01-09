-- Tighten access to user profiles
-- 1) Replace the SELECT policy to avoid broad EXISTS-based enumeration.
--    New rule: a user can read their own profile, or profiles of users who share at least one family with them.
DROP POLICY IF EXISTS "Users can view own profile and direct family members" ON public.profiles;

CREATE POLICY "Users can view own profile or shared-family profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  auth.uid() = id
  OR public.shares_family_with(id, auth.uid())
);

-- 2) Fix moderator UPDATE policy argument order so only a moderator of the target member can update.
DROP POLICY IF EXISTS "Moderators can update family member profiles" ON public.profiles;

CREATE POLICY "Moderators can update family member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_moderator_of_family_member(id, auth.uid()))
WITH CHECK (public.is_moderator_of_family_member(id, auth.uid()));

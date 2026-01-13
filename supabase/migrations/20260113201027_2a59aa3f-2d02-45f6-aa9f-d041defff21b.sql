-- Drop existing SELECT policies and recreate with explicit role restriction
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view profiles of direct family members" ON public.profiles;

-- Recreate policies with explicit 'TO authenticated' to block anonymous access
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

CREATE POLICY "Users can view profiles of family members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = profiles.id
  )
);

-- Also allow professional moderators to view profiles of families they're assigned to
CREATE POLICY "Professional moderators can view assigned family profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.temporary_moderator_requests tmr
    JOIN public.family_members fm ON fm.family_id = tmr.family_id
    WHERE tmr.assigned_moderator_id = auth.uid()
      AND tmr.status = 'active'
      AND tmr.expires_at > now()
      AND fm.user_id = profiles.id
  )
  OR EXISTS (
    SELECT 1
    FROM public.paid_moderator_requests pmr
    JOIN public.family_members fm ON fm.family_id = pmr.family_id
    WHERE pmr.assigned_moderator_id = auth.uid()
      AND pmr.status = 'active'
      AND (pmr.expires_at IS NULL OR pmr.expires_at > now())
      AND fm.user_id = profiles.id
  )
);
-- Drop existing policies and recreate with explicit authenticated role
DROP POLICY IF EXISTS "Users can view profiles of family members" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Moderators can update family member profiles" ON public.profiles;

-- Recreate policies targeting only authenticated users explicitly
CREATE POLICY "Users can view profiles of family members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  (auth.uid() = id) OR 
  (EXISTS (
    SELECT 1
    FROM family_members fm1
    JOIN family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid() AND fm2.user_id = profiles.id
  ))
);

CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

CREATE POLICY "Moderators can update family member profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (is_moderator_of_family_member(auth.uid(), id))
WITH CHECK (is_moderator_of_family_member(auth.uid(), id));
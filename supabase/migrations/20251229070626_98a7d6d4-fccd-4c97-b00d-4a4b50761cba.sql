-- Add UPDATE policy to restrict family modifications to moderators only
CREATE POLICY "Moderators can update their families"
ON public.families
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'moderator'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = families.id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'moderator'
  )
);
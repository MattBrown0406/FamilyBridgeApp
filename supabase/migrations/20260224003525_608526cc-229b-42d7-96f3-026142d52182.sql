-- Fix: Allow admin role (not just moderator) to view family invite codes
DROP POLICY IF EXISTS "Only moderators can view invite codes" ON family_invite_codes;

CREATE POLICY "Moderators and admins can view invite codes"
ON family_invite_codes FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM family_members
    WHERE family_members.family_id = family_invite_codes.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role IN ('moderator', 'admin')
  )
);
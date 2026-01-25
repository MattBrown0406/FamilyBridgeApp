-- Drop the existing SELECT policy for messages
DROP POLICY IF EXISTS "Users can view messages in their families" ON public.messages;

-- Create a new SELECT policy that restricts "recovering" users to only see messages from their join date forward
-- Other roles (member, moderator, admin) can see all family messages
CREATE POLICY "Users can view messages in their families" ON public.messages 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.family_members fm 
      WHERE fm.family_id = messages.family_id 
        AND fm.user_id = auth.uid()
        AND (
          -- Non-recovering members can see all messages
          fm.role != 'recovering'
          OR
          -- Recovering members can only see messages from their join date forward
          (fm.role = 'recovering' AND messages.created_at >= fm.joined_at)
        )
    )
  );
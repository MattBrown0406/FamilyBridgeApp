-- Drop the buggy policy
DROP POLICY IF EXISTS "Users can view their conversations" ON public.private_conversations;

-- Create the corrected policy - fix: reference private_conversations.id, not pcp.id
CREATE POLICY "Users can view their conversations" 
ON public.private_conversations 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1
    FROM private_conversation_participants pcp
    WHERE pcp.conversation_id = private_conversations.id
      AND pcp.user_id = auth.uid()
  )
);
-- Fix infinite recursion in private_conversation_participants RLS policies
-- The issue: policies reference pcp.conversation_id = pcp.conversation_id instead of 
-- comparing to the actual row's conversation_id

-- Drop the broken policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.private_conversation_participants;
DROP POLICY IF EXISTS "Conversation members can add participants" ON public.private_conversation_participants;

-- Recreate the SELECT policy correctly
CREATE POLICY "Users can view conversation participants" 
ON public.private_conversation_participants 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM private_conversation_participants pcp2
    WHERE pcp2.conversation_id = private_conversation_participants.conversation_id 
    AND pcp2.user_id = auth.uid()
  )
);

-- Recreate the INSERT policy correctly
CREATE POLICY "Conversation members can add participants" 
ON public.private_conversation_participants 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM private_conversation_participants pcp
    WHERE pcp.conversation_id = private_conversation_participants.conversation_id 
    AND pcp.user_id = auth.uid()
  ) 
  OR 
  EXISTS (
    SELECT 1 FROM private_conversations pc
    WHERE pc.id = private_conversation_participants.conversation_id 
    AND pc.created_by = auth.uid()
  )
);
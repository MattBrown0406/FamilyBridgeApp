-- Create conversations table for private chats (1:1 or group)
CREATE TABLE public.private_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  name TEXT, -- Optional name for group chats
  is_group BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create conversation participants table
CREATE TABLE public.private_conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_read_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Create new messages table for conversations
CREATE TABLE public.private_conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.private_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_conversation_messages ENABLE ROW LEVEL SECURITY;

-- RLS for private_conversations: Users can view conversations they're part of
CREATE POLICY "Users can view their conversations"
ON public.private_conversations
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = id AND pcp.user_id = auth.uid()
  )
);

-- Users can create conversations in families they belong to
CREATE POLICY "Users can create conversations in their families"
ON public.private_conversations
FOR INSERT
WITH CHECK (
  auth.uid() = created_by AND
  is_family_member(family_id, auth.uid())
);

-- RLS for participants: Users can view participants of conversations they're in
CREATE POLICY "Users can view conversation participants"
ON public.private_conversation_participants
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp2
    WHERE pcp2.conversation_id = conversation_id AND pcp2.user_id = auth.uid()
  )
);

-- Conversation creators can add participants
CREATE POLICY "Conversation members can add participants"
ON public.private_conversation_participants
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = conversation_id AND pcp.user_id = auth.uid()
  ) OR
  EXISTS (
    SELECT 1 FROM public.private_conversations pc
    WHERE pc.id = conversation_id AND pc.created_by = auth.uid()
  )
);

-- Users can update their own last_read_at
CREATE POLICY "Users can update their own participant record"
ON public.private_conversation_participants
FOR UPDATE
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

-- RLS for messages: Users can view messages in their conversations
CREATE POLICY "Users can view messages in their conversations"
ON public.private_conversation_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = conversation_id AND pcp.user_id = auth.uid()
  )
);

-- Users can send messages to conversations they're in
CREATE POLICY "Users can send messages to their conversations"
ON public.private_conversation_messages
FOR INSERT
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM public.private_conversation_participants pcp
    WHERE pcp.conversation_id = conversation_id AND pcp.user_id = auth.uid()
  )
);

-- Create indexes for performance
CREATE INDEX idx_conversation_participants_user ON public.private_conversation_participants(user_id);
CREATE INDEX idx_conversation_participants_conv ON public.private_conversation_participants(conversation_id);
CREATE INDEX idx_conversation_messages_conv ON public.private_conversation_messages(conversation_id);
CREATE INDEX idx_conversation_messages_created ON public.private_conversation_messages(created_at DESC);
CREATE INDEX idx_conversations_family ON public.private_conversations(family_id);

-- Enable realtime for messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_conversation_messages;

-- Update timestamp trigger for conversations
CREATE TRIGGER update_private_conversations_updated_at
BEFORE UPDATE ON public.private_conversations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
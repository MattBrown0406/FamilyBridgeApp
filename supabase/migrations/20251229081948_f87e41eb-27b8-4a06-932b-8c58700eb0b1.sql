-- Create private_messages table for direct messaging between moderator and members
CREATE TABLE public.private_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  recipient_id UUID NOT NULL,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.private_messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages where they are sender or recipient
CREATE POLICY "Users can view their private messages"
ON public.private_messages
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

-- Users can send private messages (moderators can message anyone, members can only message moderators)
CREATE POLICY "Users can send private messages"
ON public.private_messages
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id AND
  EXISTS (
    SELECT 1 FROM family_members fm
    WHERE fm.family_id = private_messages.family_id
    AND fm.user_id = auth.uid()
  ) AND
  (
    -- Sender is moderator (can message anyone in family)
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = private_messages.family_id
      AND fm.user_id = auth.uid()
      AND fm.role = 'moderator'
    )
    OR
    -- Sender is member and recipient is moderator
    EXISTS (
      SELECT 1 FROM family_members fm
      WHERE fm.family_id = private_messages.family_id
      AND fm.user_id = private_messages.recipient_id
      AND fm.role = 'moderator'
    )
  )
);

-- Users can mark messages as read
CREATE POLICY "Recipients can mark messages as read"
ON public.private_messages
FOR UPDATE
TO authenticated
USING (auth.uid() = recipient_id)
WITH CHECK (auth.uid() = recipient_id);

-- Enable realtime for private messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.private_messages;
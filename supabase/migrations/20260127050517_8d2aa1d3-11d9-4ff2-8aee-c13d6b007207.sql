-- Table for storing FIIS AI chat conversations per family
CREATE TABLE public.fiis_moderator_chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  moderator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Table for storing individual messages in FIIS AI chats
CREATE TABLE public.fiis_moderator_chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.fiis_moderator_chats(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.fiis_moderator_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fiis_moderator_chat_messages ENABLE ROW LEVEL SECURITY;

-- Indexes for performance
CREATE INDEX idx_fiis_mod_chats_family ON public.fiis_moderator_chats(family_id);
CREATE INDEX idx_fiis_mod_chats_moderator ON public.fiis_moderator_chats(moderator_id);
CREATE INDEX idx_fiis_mod_chat_messages_chat ON public.fiis_moderator_chat_messages(chat_id);

-- RLS policies for fiis_moderator_chats
CREATE POLICY "Moderators can view chats for their assigned families"
ON public.fiis_moderator_chats
FOR SELECT
USING (
  public.is_family_moderator(family_id, auth.uid())
  OR public.is_managing_org_member(family_id, auth.uid())
  OR public.is_super_admin(auth.uid())
);

CREATE POLICY "Moderators can create chats for their assigned families"
ON public.fiis_moderator_chats
FOR INSERT
WITH CHECK (
  moderator_id = auth.uid()
  AND (
    public.is_family_moderator(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
  )
);

CREATE POLICY "Moderators can update their own chats"
ON public.fiis_moderator_chats
FOR UPDATE
USING (moderator_id = auth.uid());

-- RLS policies for fiis_moderator_chat_messages
CREATE POLICY "Users can view messages from accessible chats"
ON public.fiis_moderator_chat_messages
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.fiis_moderator_chats c
    WHERE c.id = chat_id
    AND (
      public.is_family_moderator(c.family_id, auth.uid())
      OR public.is_managing_org_member(c.family_id, auth.uid())
      OR public.is_super_admin(auth.uid())
    )
  )
);

CREATE POLICY "Users can insert messages to accessible chats"
ON public.fiis_moderator_chat_messages
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.fiis_moderator_chats c
    WHERE c.id = chat_id
    AND (
      c.moderator_id = auth.uid()
      OR public.is_managing_org_member(c.family_id, auth.uid())
    )
  )
);

-- Trigger to update chat updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_fiis_chat_timestamp()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.fiis_moderator_chats
  SET updated_at = now()
  WHERE id = NEW.chat_id;
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_chat_timestamp
AFTER INSERT ON public.fiis_moderator_chat_messages
FOR EACH ROW
EXECUTE FUNCTION public.update_fiis_chat_timestamp();
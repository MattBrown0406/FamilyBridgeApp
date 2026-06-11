-- Add lightweight iMessage-style reactions to family chat messages.
-- Family members can acknowledge a message with one reaction (thumbs up or heart)
-- without sending another chat message.

CREATE TABLE IF NOT EXISTS public.message_reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reaction_type TEXT NOT NULL CHECK (reaction_type IN ('thumbs_up', 'heart')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(message_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_family_id ON public.message_reactions(family_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Family members can view message reactions"
ON public.message_reactions
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
);

CREATE POLICY "Family members can add their own message reactions"
ON public.message_reactions
FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND m.family_id = message_reactions.family_id
  )
);

CREATE POLICY "Family members can update their own message reactions"
ON public.message_reactions
FOR UPDATE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
)
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
  AND EXISTS (
    SELECT 1
    FROM public.messages m
    WHERE m.id = message_reactions.message_id
      AND m.family_id = message_reactions.family_id
  )
);

CREATE POLICY "Family members can remove their own message reactions"
ON public.message_reactions
FOR DELETE
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
);

CREATE TRIGGER update_message_reactions_updated_at
BEFORE UPDATE ON public.message_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

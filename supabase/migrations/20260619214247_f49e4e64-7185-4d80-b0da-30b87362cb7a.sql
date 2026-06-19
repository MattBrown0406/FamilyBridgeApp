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

GRANT SELECT, INSERT, UPDATE, DELETE ON public.message_reactions TO authenticated;
GRANT ALL ON public.message_reactions TO service_role;

CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_family_id ON public.message_reactions(family_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Family members can view message reactions" ON public.message_reactions;
CREATE POLICY "Family members can view message reactions"
ON public.message_reactions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Family members can add their own message reactions" ON public.message_reactions;
CREATE POLICY "Family members can add their own message reactions"
ON public.message_reactions
FOR INSERT
TO authenticated
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

DROP POLICY IF EXISTS "Family members can update their own message reactions" ON public.message_reactions;
CREATE POLICY "Family members can update their own message reactions"
ON public.message_reactions
FOR UPDATE
TO authenticated
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

DROP POLICY IF EXISTS "Family members can remove their own message reactions" ON public.message_reactions;
CREATE POLICY "Family members can remove their own message reactions"
ON public.message_reactions
FOR DELETE
TO authenticated
USING (
  auth.uid() = user_id
  AND EXISTS (
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = message_reactions.family_id
      AND fm.user_id = auth.uid()
  )
);

DROP TRIGGER IF EXISTS update_message_reactions_updated_at ON public.message_reactions;
CREATE TRIGGER update_message_reactions_updated_at
BEFORE UPDATE ON public.message_reactions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.message_reactions;
  EXCEPTION
    WHEN duplicate_object THEN NULL;
    WHEN undefined_object THEN NULL;
    WHEN insufficient_privilege THEN NULL;
  END;
END $$;
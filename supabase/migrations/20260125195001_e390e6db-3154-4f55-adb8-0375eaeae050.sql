-- Create security definer function to check conversation membership (breaks infinite recursion)
CREATE OR REPLACE FUNCTION public.is_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.private_conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can view conversation participants" ON public.private_conversation_participants;
DROP POLICY IF EXISTS "Conversation members can add participants" ON public.private_conversation_participants;

-- Recreate SELECT policy using security definer function
CREATE POLICY "Users can view conversation participants"
ON public.private_conversation_participants
FOR SELECT
USING (public.is_conversation_participant(conversation_id, auth.uid()));

-- Recreate INSERT policy using security definer function
CREATE POLICY "Conversation members can add participants"
ON public.private_conversation_participants
FOR INSERT
WITH CHECK (
  public.is_conversation_participant(conversation_id, auth.uid())
  OR EXISTS (
    SELECT 1 FROM public.private_conversations pc
    WHERE pc.id = conversation_id AND pc.created_by = auth.uid()
  )
);
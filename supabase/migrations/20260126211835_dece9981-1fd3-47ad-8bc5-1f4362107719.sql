-- Create enum types for provider notes
CREATE TYPE public.provider_note_type AS ENUM ('observation', 'concern', 'hypothesis', 'action');
CREATE TYPE public.provider_note_confidence AS ENUM ('low', 'moderate', 'high');
CREATE TYPE public.provider_note_horizon AS ENUM ('immediate', 'emerging', 'longitudinal');
CREATE TYPE public.provider_note_visibility AS ENUM ('internal_only', 'shareable_summary');

-- Provider notes table - clinical notes for provider team collaboration
CREATE TABLE public.provider_notes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  author_id UUID NOT NULL,
  note_type public.provider_note_type NOT NULL DEFAULT 'observation',
  confidence_level public.provider_note_confidence NOT NULL DEFAULT 'moderate',
  time_horizon public.provider_note_horizon NOT NULL DEFAULT 'emerging',
  visibility public.provider_note_visibility NOT NULL DEFAULT 'internal_only',
  include_in_ai_analysis BOOLEAN NOT NULL DEFAULT true,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.provider_notes ENABLE ROW LEVEL SECURITY;

-- Policies for provider notes
CREATE POLICY "Org members can view their org notes"
ON public.provider_notes
FOR SELECT
TO authenticated
USING (public.is_org_member(organization_id, auth.uid()));

CREATE POLICY "Org members can create notes"
ON public.provider_notes
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND author_id = auth.uid());

CREATE POLICY "Authors can update own notes"
ON public.provider_notes
FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Authors can delete own notes"
ON public.provider_notes
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Provider conversations table - for group/DM messaging between providers
CREATE TABLE public.provider_conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  family_id UUID REFERENCES public.families(id) ON DELETE SET NULL,
  name TEXT,
  is_direct_message BOOLEAN NOT NULL DEFAULT false,
  created_by UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Provider conversation participants
CREATE TABLE public.provider_conversation_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.provider_conversations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(conversation_id, user_id)
);

-- Provider messages
CREATE TABLE public.provider_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.provider_conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.provider_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_conversation_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.provider_messages ENABLE ROW LEVEL SECURITY;

-- Function to check if user is a participant in provider conversation
CREATE OR REPLACE FUNCTION public.is_provider_conversation_participant(_conversation_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.provider_conversation_participants
    WHERE conversation_id = _conversation_id
      AND user_id = _user_id
  )
$$;

-- RLS for provider_conversations
CREATE POLICY "Participants can view conversations"
ON public.provider_conversations
FOR SELECT
TO authenticated
USING (public.is_provider_conversation_participant(id, auth.uid()));

CREATE POLICY "Org members can create conversations"
ON public.provider_conversations
FOR INSERT
TO authenticated
WITH CHECK (public.is_org_member(organization_id, auth.uid()) AND created_by = auth.uid());

CREATE POLICY "Creators can update conversations"
ON public.provider_conversations
FOR UPDATE
TO authenticated
USING (created_by = auth.uid());

-- RLS for provider_conversation_participants
CREATE POLICY "Participants can view other participants"
ON public.provider_conversation_participants
FOR SELECT
TO authenticated
USING (public.is_provider_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Conversation creators can add participants"
ON public.provider_conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.provider_conversations pc
    WHERE pc.id = conversation_id
      AND pc.created_by = auth.uid()
  )
  OR conversation_id IN (
    SELECT id FROM public.provider_conversations
    WHERE created_by = auth.uid()
  )
);

CREATE POLICY "Users can leave conversations"
ON public.provider_conversation_participants
FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- RLS for provider_messages
CREATE POLICY "Participants can view messages"
ON public.provider_messages
FOR SELECT
TO authenticated
USING (public.is_provider_conversation_participant(conversation_id, auth.uid()));

CREATE POLICY "Participants can send messages"
ON public.provider_messages
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_provider_conversation_participant(conversation_id, auth.uid()) 
  AND sender_id = auth.uid()
);

-- Add realtime for provider messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.provider_messages;

-- Create indexes for performance
CREATE INDEX idx_provider_notes_org_id ON public.provider_notes(organization_id);
CREATE INDEX idx_provider_notes_family_id ON public.provider_notes(family_id);
CREATE INDEX idx_provider_notes_author_id ON public.provider_notes(author_id);
CREATE INDEX idx_provider_conversations_org_id ON public.provider_conversations(organization_id);
CREATE INDEX idx_provider_messages_conversation_id ON public.provider_messages(conversation_id);
CREATE INDEX idx_provider_conversation_participants_user_id ON public.provider_conversation_participants(user_id);
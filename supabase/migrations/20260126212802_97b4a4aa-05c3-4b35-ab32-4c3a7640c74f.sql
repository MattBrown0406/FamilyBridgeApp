-- Function to check if user is a moderator of a specific family
CREATE OR REPLACE FUNCTION public.is_family_moderator_or_org_member(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check if user is a moderator of this family
    SELECT 1
    FROM public.family_members fm
    WHERE fm.family_id = _family_id
      AND fm.user_id = _user_id
      AND fm.role = 'moderator'
  ) OR EXISTS (
    -- Check if user is an org member of the org that owns this family
    SELECT 1
    FROM public.families f
    JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = _family_id
      AND om.user_id = _user_id
  )
$$;

-- Drop existing provider_notes policies
DROP POLICY IF EXISTS "Org members can view their org notes" ON public.provider_notes;
DROP POLICY IF EXISTS "Org members can create notes" ON public.provider_notes;
DROP POLICY IF EXISTS "Authors can update their notes" ON public.provider_notes;
DROP POLICY IF EXISTS "Authors can delete their notes" ON public.provider_notes;

-- New family-scoped policies for provider_notes
-- Notes are visible to: org members (all notes) OR family moderators (notes for their families)
CREATE POLICY "Org members and family moderators can view notes"
ON public.provider_notes
FOR SELECT
TO authenticated
USING (
  public.is_org_member(organization_id, auth.uid())
  OR (family_id IS NOT NULL AND public.is_family_moderator_or_org_member(family_id, auth.uid()))
);

-- Org members can create notes for any family, moderators only for their families
CREATE POLICY "Org members and family moderators can create notes"
ON public.provider_notes
FOR INSERT
TO authenticated
WITH CHECK (
  author_id = auth.uid() 
  AND (
    public.is_org_member(organization_id, auth.uid())
    OR (family_id IS NOT NULL AND public.is_family_moderator_or_org_member(family_id, auth.uid()))
  )
);

CREATE POLICY "Authors can update their notes"
ON public.provider_notes
FOR UPDATE
TO authenticated
USING (author_id = auth.uid());

CREATE POLICY "Authors can delete their notes"
ON public.provider_notes
FOR DELETE
TO authenticated
USING (author_id = auth.uid());

-- Update provider_conversations policies to allow moderators
DROP POLICY IF EXISTS "Participants can view conversations" ON public.provider_conversations;
DROP POLICY IF EXISTS "Org members can create conversations" ON public.provider_conversations;

-- Moderators can view conversations for their families
CREATE POLICY "Participants and moderators can view conversations"
ON public.provider_conversations
FOR SELECT
TO authenticated
USING (
  public.is_provider_conversation_participant(id, auth.uid())
  OR (family_id IS NOT NULL AND public.is_family_moderator_or_org_member(family_id, auth.uid()))
);

-- Moderators can create conversations for their families
CREATE POLICY "Org members and moderators can create conversations"
ON public.provider_conversations
FOR INSERT
TO authenticated
WITH CHECK (
  created_by = auth.uid() 
  AND (
    public.is_org_member(organization_id, auth.uid())
    OR (family_id IS NOT NULL AND public.is_family_moderator_or_org_member(family_id, auth.uid()))
  )
);

-- Update participant policies to allow moderators to be added
DROP POLICY IF EXISTS "Conversation creators can add participants" ON public.provider_conversation_participants;

CREATE POLICY "Creators and moderators can add participants"
ON public.provider_conversation_participants
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.provider_conversations pc
    WHERE pc.id = conversation_id
      AND (
        pc.created_by = auth.uid()
        OR (pc.family_id IS NOT NULL AND public.is_family_moderator_or_org_member(pc.family_id, auth.uid()))
      )
  )
);
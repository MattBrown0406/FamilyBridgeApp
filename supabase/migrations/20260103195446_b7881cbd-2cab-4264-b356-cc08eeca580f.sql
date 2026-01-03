-- Add private_messaging_enabled column to family_members (defaults to false for recovering users)
ALTER TABLE public.family_members 
ADD COLUMN private_messaging_enabled boolean NOT NULL DEFAULT false;

-- Create a function to check if a user is a professional moderator for a family
CREATE OR REPLACE FUNCTION public.is_professional_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    -- Check temporary moderator requests
    SELECT 1 FROM public.temporary_moderator_requests
    WHERE family_id = _family_id
      AND assigned_moderator_id = _user_id
      AND status = 'active'
      AND expires_at > now()
  ) OR EXISTS (
    -- Check paid moderator requests
    SELECT 1 FROM public.paid_moderator_requests
    WHERE family_id = _family_id
      AND assigned_moderator_id = _user_id
      AND status = 'active'
      AND (expires_at IS NULL OR expires_at > now())
  )
$$;

-- Drop the existing INSERT policy
DROP POLICY IF EXISTS "Users can send private messages" ON public.private_messages;

-- Create updated INSERT policy that allows:
-- 1. Moderators can message anyone in their family
-- 2. Recovering users can always message professional moderators
-- 3. Recovering users with private_messaging_enabled can message family moderators
CREATE POLICY "Users can send private messages" 
ON public.private_messages 
FOR INSERT 
WITH CHECK (
  (auth.uid() = sender_id) 
  AND (EXISTS (
    SELECT 1 FROM family_members fm 
    WHERE fm.family_id = private_messages.family_id 
    AND fm.user_id = auth.uid()
  ))
  AND (
    -- Sender is a moderator - can message anyone
    (EXISTS (
      SELECT 1 FROM family_members fm 
      WHERE fm.family_id = private_messages.family_id 
      AND fm.user_id = auth.uid() 
      AND fm.role = 'moderator'
    ))
    OR
    -- Recipient is a professional moderator - always allowed
    (is_professional_moderator(private_messages.family_id, private_messages.recipient_id))
    OR
    -- Sender has private messaging enabled AND recipient is a moderator
    (
      (EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.family_id = private_messages.family_id 
        AND fm.user_id = auth.uid() 
        AND fm.private_messaging_enabled = true
      ))
      AND
      (EXISTS (
        SELECT 1 FROM family_members fm 
        WHERE fm.family_id = private_messages.family_id 
        AND fm.user_id = private_messages.recipient_id 
        AND fm.role = 'moderator'
      ))
    )
  )
);
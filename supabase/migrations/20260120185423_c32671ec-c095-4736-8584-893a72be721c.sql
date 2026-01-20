-- Create table to track broadcast messages
CREATE TABLE public.broadcast_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  subject TEXT,
  content TEXT NOT NULL,
  family_ids UUID[] NOT NULL,
  sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add index for organization lookups
CREATE INDEX idx_broadcast_messages_org ON public.broadcast_messages(organization_id);
CREATE INDEX idx_broadcast_messages_sender ON public.broadcast_messages(sender_id);
CREATE INDEX idx_broadcast_messages_sent_at ON public.broadcast_messages(sent_at DESC);

-- Enable RLS
ALTER TABLE public.broadcast_messages ENABLE ROW LEVEL SECURITY;

-- Policy: org members can view broadcasts from their org
CREATE POLICY "Org members can view their org broadcasts"
ON public.broadcast_messages
FOR SELECT
USING (
  public.is_org_member(organization_id, auth.uid())
);

-- Policy: org admins and staff can insert broadcasts
CREATE POLICY "Org members can create broadcasts"
ON public.broadcast_messages
FOR INSERT
WITH CHECK (
  public.is_org_member(organization_id, auth.uid())
  AND sender_id = auth.uid()
);

-- Add a flag to messages table to mark announcements
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS is_announcement BOOLEAN DEFAULT false;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS announcement_subject TEXT;
-- Create a table to store pending invite role assignments
CREATE TABLE public.pending_invite_roles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  family_id UUID NOT NULL REFERENCES public.families(id) ON DELETE CASCADE,
  invite_code TEXT NOT NULL,
  email TEXT NOT NULL,
  intended_role TEXT NOT NULL DEFAULT 'member',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  used_at TIMESTAMP WITH TIME ZONE,
  UNIQUE(family_id, email)
);

-- Enable RLS
ALTER TABLE public.pending_invite_roles ENABLE ROW LEVEL SECURITY;

-- Policy: Admins and moderators can create pending invites for their families
CREATE POLICY "Admins and moderators can manage pending invites"
ON public.pending_invite_roles
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = pending_invite_roles.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = pending_invite_roles.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
);

-- Add index for fast lookup during join
CREATE INDEX idx_pending_invite_roles_lookup ON public.pending_invite_roles(invite_code, email) WHERE used_at IS NULL;
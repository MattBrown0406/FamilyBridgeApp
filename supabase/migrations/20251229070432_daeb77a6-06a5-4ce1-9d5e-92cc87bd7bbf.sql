-- Create a separate secure table for invite codes
CREATE TABLE public.family_invite_codes (
  family_id uuid PRIMARY KEY REFERENCES public.families(id) ON DELETE CASCADE,
  invite_code text NOT NULL DEFAULT substr(md5((random())::text), 1, 8),
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.family_invite_codes ENABLE ROW LEVEL SECURITY;

-- Only moderators can view invite codes
CREATE POLICY "Only moderators can view invite codes"
ON public.family_invite_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = family_invite_codes.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'moderator'
  )
);

-- Migrate existing invite codes to the new table
INSERT INTO public.family_invite_codes (family_id, invite_code)
SELECT id, invite_code FROM public.families WHERE invite_code IS NOT NULL
ON CONFLICT (family_id) DO NOTHING;

-- Clear invite codes from the families table (they're now in the secure table)
UPDATE public.families SET invite_code = NULL;

-- Update the get_family_invite_code function to use the new secure table
CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fic.invite_code
  FROM public.family_invite_codes fic
  INNER JOIN public.family_members fm ON fm.family_id = fic.family_id
  WHERE fic.family_id = _family_id
    AND fm.user_id = auth.uid()
    AND fm.role = 'moderator'
$$;
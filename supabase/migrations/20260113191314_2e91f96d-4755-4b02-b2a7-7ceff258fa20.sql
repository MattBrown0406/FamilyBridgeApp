-- Update the get_family_invite_code function to also allow admin role
CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
 RETURNS text
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $$
  SELECT fic.invite_code
  FROM public.family_invite_codes fic
  INNER JOIN public.family_members fm ON fm.family_id = fic.family_id
  WHERE fic.family_id = _family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('moderator', 'admin')
$$;
-- Add family_id tracking for provider message alerts
-- We'll use the existing notifications table to send alerts

-- Create a function to get the assigned moderator for a family
CREATE OR REPLACE FUNCTION public.get_family_moderator_id(_family_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT fm.user_id
  FROM public.family_members fm
  WHERE fm.family_id = _family_id
    AND fm.role = 'moderator'
  LIMIT 1;
$$;

-- Create a function to get provider admins for a family's organization
CREATE OR REPLACE FUNCTION public.get_family_provider_admins(_family_id uuid)
RETURNS TABLE(user_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.user_id
  FROM public.families f
  JOIN public.organization_members om ON om.organization_id = f.organization_id
  WHERE f.id = _family_id
    AND om.role IN ('owner', 'admin');
$$;
-- Fix profiles RLS policy to restrict organization visibility
-- Organization staff should only see profiles of users in families belonging to their org
-- (not ALL users who happen to be org members)

DROP POLICY IF EXISTS "Users can view profiles in their context" ON public.profiles;

CREATE POLICY "Users can view profiles in their context"
ON public.profiles
FOR SELECT
USING (
  -- Can always see own profile
  (auth.uid() = id)
  OR 
  -- Can see profiles of people in the same family
  (EXISTS (
    SELECT 1
    FROM public.family_members fm1
    JOIN public.family_members fm2 ON fm1.family_id = fm2.family_id
    WHERE fm1.user_id = auth.uid()
      AND fm2.user_id = profiles.id
  ))
  OR
  -- Organization staff can see profiles of users in families that belong to their organization
  (EXISTS (
    SELECT 1
    FROM public.organization_members om
    JOIN public.families f ON f.organization_id = om.organization_id
    JOIN public.family_members fm ON fm.family_id = f.id
    WHERE om.user_id = auth.uid()
      AND fm.user_id = profiles.id
  ))
);
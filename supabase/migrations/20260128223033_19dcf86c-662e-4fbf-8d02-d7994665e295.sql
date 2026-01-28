
-- Allow organization members to view family members of families in their organization
CREATE POLICY "Org members can view family members of their org families"
ON public.family_members
FOR SELECT
TO authenticated
USING (
  public.is_managing_org_member(family_id, auth.uid())
);

-- Allow org members to view profiles of family members in their org's families
-- This supplements the existing "Profiles visible to permanent members only" policy
CREATE POLICY "Org members can view profiles of org family members"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.family_members fm
    JOIN public.families f ON f.id = fm.family_id
    JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE fm.user_id = profiles.id
      AND om.user_id = auth.uid()
  )
);

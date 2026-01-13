-- Add policy for organization admins to view invite codes for families in their org
CREATE POLICY "Org admins can view invite codes for their org families"
ON public.family_invite_codes
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.families f
    INNER JOIN public.organization_members om ON om.organization_id = f.organization_id
    WHERE f.id = family_invite_codes.family_id
      AND om.user_id = auth.uid()
      AND om.role IN ('owner', 'admin')
  )
);
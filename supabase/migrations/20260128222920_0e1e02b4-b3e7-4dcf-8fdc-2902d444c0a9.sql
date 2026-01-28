
-- Add policy for organization members to view families belonging to their organization
-- This completes the org-level data isolation model

CREATE POLICY "Org members can view their organization families"
ON public.families
FOR SELECT
TO authenticated
USING (
  organization_id IS NOT NULL 
  AND public.is_org_member(organization_id, auth.uid())
);

-- Add comment for documentation
COMMENT ON POLICY "Org members can view their organization families" ON public.families IS 
'Allows organization staff to view all families that belong to their organization for dashboard listings and management purposes.';

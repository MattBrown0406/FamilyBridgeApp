-- The table, indexes, constraints, policies, and publication membership were
-- already renamed by 20260419185500. PostgreSQL preserves publication
-- membership across a table rename, so repeating those operations is unsafe.

DROP POLICY IF EXISTS "Family members can view liquor license warnings" ON public.location_risk_warnings;
DROP POLICY IF EXISTS "Family members can view location risk warnings" ON public.location_risk_warnings;
CREATE POLICY "Family members can view location risk warnings"
ON public.location_risk_warnings
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = location_risk_warnings.family_id
    AND fm.user_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Admins and moderators can update warnings" ON public.location_risk_warnings;
DROP POLICY IF EXISTS "Admins and moderators can update location risk warnings" ON public.location_risk_warnings;
CREATE POLICY "Admins and moderators can update location risk warnings"
ON public.location_risk_warnings
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.family_members fm
    WHERE fm.family_id = location_risk_warnings.family_id
    AND fm.user_id = auth.uid()
    AND fm.role IN ('admin', 'moderator')
  )
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.location_risk_warnings TO authenticated;
GRANT ALL ON public.location_risk_warnings TO service_role;
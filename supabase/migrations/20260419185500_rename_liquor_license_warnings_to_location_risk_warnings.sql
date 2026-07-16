ALTER TABLE public.liquor_license_warnings RENAME TO location_risk_warnings;

ALTER INDEX public.idx_liquor_license_warnings_family_id RENAME TO idx_location_risk_warnings_family_id;
ALTER INDEX public.idx_liquor_license_warnings_checkin_id RENAME TO idx_location_risk_warnings_checkin_id;

ALTER TABLE public.location_risk_warnings RENAME CONSTRAINT liquor_license_warnings_checkin_id_fkey TO location_risk_warnings_checkin_id_fkey;
ALTER TABLE public.location_risk_warnings RENAME CONSTRAINT liquor_license_warnings_family_id_fkey TO location_risk_warnings_family_id_fkey;

DROP POLICY IF EXISTS "Family members can view liquor license warnings" ON public.location_risk_warnings;
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

-- Renaming a table preserves its publication membership. Do not drop the old
-- name or add the new name: after the rename the old relation no longer exists,
-- while the renamed relation is already in supabase_realtime.

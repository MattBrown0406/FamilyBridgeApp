CREATE OR REPLACE FUNCTION public.can_view_profile(_viewer_id uuid, _profile_id uuid)
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT
    _viewer_id = _profile_id
    OR public.is_super_admin(_viewer_id)
    OR EXISTS (
      SELECT 1
      FROM family_members viewer_fm
      JOIN family_members profile_fm ON viewer_fm.family_id = profile_fm.family_id
      WHERE viewer_fm.user_id = _viewer_id
        AND profile_fm.user_id = _profile_id
    )
    -- Organization staff: only for ACTIVE (non-archived) families currently managed by their org
    OR EXISTS (
      SELECT 1
      FROM family_members fm
      JOIN families f ON f.id = fm.family_id
      JOIN organization_members om ON om.organization_id = f.organization_id
      WHERE fm.user_id = _profile_id
        AND om.user_id = _viewer_id
        AND om.role IN ('owner','admin','staff')
        AND COALESCE(f.is_archived, false) = false
    )
    OR EXISTS (
      SELECT 1
      FROM temporary_moderator_requests tmr
      JOIN family_members fm ON fm.family_id = tmr.family_id
      WHERE tmr.assigned_moderator_id = _viewer_id
        AND tmr.status = 'active'
        AND tmr.expires_at > now()
        AND fm.user_id = _profile_id
    )
    OR EXISTS (
      SELECT 1
      FROM paid_moderator_requests pmr
      JOIN family_members fm ON fm.family_id = pmr.family_id
      WHERE pmr.assigned_moderator_id = _viewer_id
        AND pmr.status = 'active'
        AND fm.user_id = _profile_id
    )
$function$;
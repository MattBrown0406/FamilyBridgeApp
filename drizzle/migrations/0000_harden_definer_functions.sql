REVOKE EXECUTE ON FUNCTION public.get_super_admin_ids() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.get_super_admin_ids() TO service_role;

CREATE OR REPLACE FUNCTION public.get_anonymized_family_patterns(_family_id uuid)
 RETURNS TABLE(id uuid, family_id uuid, pattern_type text, pattern_description text, severity text, detected_at timestamp with time zone, is_acknowledged boolean, created_at timestamp with time zone, member_label text)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT ep.id, ep.family_id, ep.pattern_type, ep.pattern_description, ep.severity, ep.detected_at,
    ep.acknowledged_at IS NOT NULL, ep.created_at, 'A family member'::text
  FROM public.emotional_patterns ep
  WHERE auth.uid() IS NOT NULL AND ep.family_id = _family_id
    AND EXISTS (SELECT 1 FROM public.family_members fm WHERE fm.family_id = _family_id AND fm.user_id = auth.uid())
  ORDER BY ep.detected_at DESC;
$function$;
REVOKE EXECUTE ON FUNCTION public.get_anonymized_family_patterns(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_anonymized_family_patterns(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_family_provider_admins(_family_id uuid)
 RETURNS TABLE(user_id uuid)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT om.user_id
  FROM public.families f
  JOIN public.organization_members om ON om.organization_id = f.organization_id
  WHERE f.id = _family_id AND om.role IN ('owner','admin')
    AND (public.is_family_member(auth.uid(), _family_id) OR public.is_org_member(auth.uid(), f.organization_id));
$function$;
REVOKE EXECUTE ON FUNCTION public.get_family_provider_admins(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_family_provider_admins(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.check_hipaa_status(_family_id uuid)
 RETURNS json LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id UUID := auth.uid();
  v_org_id UUID;
  v_last_transfer_reason TEXT;
  v_last_transfer_at TIMESTAMPTZ;
  v_signed_at TIMESTAMPTZ;
BEGIN
  IF v_user_id IS NULL OR NOT public.is_family_member(v_user_id, _family_id) THEN
    RETURN json_build_object('needs_sign', false, 'is_initial', false, 'last_transfer_reason', null);
  END IF;
  SELECT organization_id INTO v_org_id FROM public.families WHERE id = _family_id;
  IF v_org_id IS NULL THEN
    RETURN json_build_object('needs_sign', false, 'is_initial', false, 'last_transfer_reason', null);
  END IF;
  SELECT transfer_reason, transferred_at INTO v_last_transfer_reason, v_last_transfer_at
  FROM public.family_org_transfer_history WHERE family_id = _family_id ORDER BY transferred_at DESC LIMIT 1;
  SELECT signed_at INTO v_signed_at FROM public.hipaa_releases
  WHERE family_id = _family_id AND user_id = v_user_id ORDER BY signed_at DESC LIMIT 1;
  RETURN json_build_object(
    'needs_sign', NOT (v_signed_at IS NOT NULL AND (v_last_transfer_at IS NULL OR v_signed_at >= v_last_transfer_at)),
    'is_initial', v_signed_at IS NULL,
    'last_transfer_reason', v_last_transfer_reason);
END;
$function$;
REVOKE EXECUTE ON FUNCTION public.check_hipaa_status(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_hipaa_status(uuid) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.get_co_moderated_families(_user_id uuid)
 RETURNS TABLE(family_id uuid, family_name text, organization_id uuid, organization_name text, display_label text, granted_at timestamp with time zone, member_count bigint)
 LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $function$
  SELECT f.id, f.name, f.organization_id, o.name, fcm.display_label, fcm.granted_at,
    (SELECT COUNT(*) FROM public.family_members fm2 WHERE fm2.family_id = f.id)
  FROM public.family_co_moderators fcm
  JOIN public.families f ON f.id = fcm.family_id
  LEFT JOIN public.organizations o ON o.id = f.organization_id
  WHERE fcm.user_id = _user_id AND _user_id = auth.uid() AND fcm.is_active = true
  ORDER BY fcm.granted_at DESC
$function$;
REVOKE EXECUTE ON FUNCTION public.get_co_moderated_families(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_co_moderated_families(uuid) TO authenticated, service_role;

-- 1) Pin search_path on existing function
ALTER FUNCTION public.set_provider_inquiries_updated_at() SET search_path TO 'public';

-- 2) Expand get_family_invite_code to include super admins and organization admins
CREATE OR REPLACE FUNCTION public.get_family_invite_code(_family_id uuid)
RETURNS text
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT f.invite_code
  FROM public.families f
  WHERE f.id = _family_id
    AND (
      public.is_super_admin(auth.uid())
      OR public.is_family_moderator(f.id, auth.uid())
      OR EXISTS (
        SELECT 1 FROM public.family_members fm
        WHERE fm.family_id = f.id
          AND fm.user_id = auth.uid()
          AND fm.role IN ('moderator', 'admin')
      )
      OR (
        f.organization_id IS NOT NULL
        AND public.is_org_member(f.organization_id, auth.uid())
      )
    )
$function$;

-- 3) Revoke column-level SELECT on families.invite_code from client roles
-- PostgREST will exclude the column from `*` expansion for these roles.
-- Service role (used by trusted edge functions like get-admin-stats) retains access.
REVOKE SELECT (invite_code) ON public.families FROM anon, authenticated;

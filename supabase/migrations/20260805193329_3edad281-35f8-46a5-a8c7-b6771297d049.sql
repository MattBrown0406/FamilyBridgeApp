-- 1) family_members: harden UPDATE path against privilege escalation
DROP POLICY IF EXISTS "Admins and moderators can update member roles" ON public.family_members;

CREATE POLICY "Admins and moderators can update member roles"
ON public.family_members
FOR UPDATE
TO authenticated
USING (public.can_approve_in_family(family_id, auth.uid()))
WITH CHECK (
  public.can_approve_in_family(family_id, auth.uid())
  AND (
    role = ANY (ARRAY['member'::family_role, 'recovering'::family_role])
    OR public.can_manage_family_admins(family_id, auth.uid())
  )
);

-- 2) activation code helper functions: authenticated-only execution
REVOKE ALL ON FUNCTION public.get_activation_code_secure(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_activation_code_secure(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.check_and_log_activation_code_access(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.check_and_log_activation_code_access(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_activation_code_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_activation_code_status() TO authenticated;

REVOKE ALL ON FUNCTION public.get_user_activation_status() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_activation_status() TO authenticated;

-- Ensure no direct table access for anonymous clients
REVOKE ALL ON TABLE public.activation_codes FROM anon;
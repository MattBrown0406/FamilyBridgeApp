
-- Fix privilege escalation: family_members self-insert must use safe roles
DROP POLICY IF EXISTS "Users can join families" ON public.family_members;
CREATE POLICY "Users can join families"
ON public.family_members
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = user_id
  AND role IN ('member', 'recovering')
);

-- Fix privilege escalation: coordination_case_members self-insert must use non-privileged role
DROP POLICY IF EXISTS "Providers can manage members" ON public.coordination_case_members;
CREATE POLICY "Providers can manage members"
ON public.coordination_case_members
FOR INSERT
TO authenticated
WITH CHECK (
  public.is_coordination_provider(case_id, auth.uid())
  OR public.is_super_admin(auth.uid())
  OR (auth.uid() = user_id AND role = 'family_member')
);

-- Fix scope: moderator_disclaimers insert must be scoped to a family the user manages
DROP POLICY IF EXISTS "Organization members can insert disclaimers" ON public.moderator_disclaimers;
CREATE POLICY "Organization members can insert disclaimers"
ON public.moderator_disclaimers
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = moderator_id
  AND (
    public.can_approve_in_family(family_id, auth.uid())
    OR public.is_managing_org_member(family_id, auth.uid())
    OR public.is_super_admin(auth.uid())
  )
);

-- Update the is_family_admin_or_moderator function to include therapist and case_manager
CREATE OR REPLACE FUNCTION public.is_family_admin_or_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND role IN ('admin', 'moderator', 'therapist', 'case_manager')
  ) OR public.is_professional_moderator(_family_id, _user_id)
$$;

-- Create a helper function to check if user can manage aftercare plans
-- Only moderators and admins can create/edit aftercare plans (not therapists/case_managers)
CREATE OR REPLACE FUNCTION public.can_manage_aftercare_plans(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.family_members
    WHERE family_id = _family_id
      AND user_id = _user_id
      AND role IN ('admin', 'moderator')
  ) OR public.is_professional_moderator(_family_id, _user_id)
$$;

-- Update aftercare_plans policies to use the new function
DROP POLICY IF EXISTS "Moderators can create aftercare plans" ON public.aftercare_plans;
DROP POLICY IF EXISTS "Moderators can update aftercare plans" ON public.aftercare_plans;
DROP POLICY IF EXISTS "Moderators can delete aftercare plans" ON public.aftercare_plans;

CREATE POLICY "Admins and moderators can create aftercare plans"
ON public.aftercare_plans FOR INSERT
TO authenticated
WITH CHECK (public.can_manage_aftercare_plans(family_id, auth.uid()));

CREATE POLICY "Admins and moderators can update aftercare plans"
ON public.aftercare_plans FOR UPDATE
TO authenticated
USING (public.can_manage_aftercare_plans(family_id, auth.uid()));

CREATE POLICY "Admins and moderators can delete aftercare plans"
ON public.aftercare_plans FOR DELETE
TO authenticated
USING (public.can_manage_aftercare_plans(family_id, auth.uid()));

-- Also update aftercare_recommendations policies
DROP POLICY IF EXISTS "Moderators can manage recommendations" ON public.aftercare_recommendations;
DROP POLICY IF EXISTS "Moderators can create recommendations" ON public.aftercare_recommendations;
DROP POLICY IF EXISTS "Moderators can update recommendations" ON public.aftercare_recommendations;
DROP POLICY IF EXISTS "Moderators can delete recommendations" ON public.aftercare_recommendations;

CREATE POLICY "Admins and moderators can create recommendations"
ON public.aftercare_recommendations FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND public.can_manage_aftercare_plans(ap.family_id, auth.uid())
  )
);

CREATE POLICY "Admins and moderators can update recommendations"
ON public.aftercare_recommendations FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND public.can_manage_aftercare_plans(ap.family_id, auth.uid())
  )
);

CREATE POLICY "Admins and moderators can delete recommendations"
ON public.aftercare_recommendations FOR DELETE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.aftercare_plans ap
    WHERE ap.id = plan_id
    AND public.can_manage_aftercare_plans(ap.family_id, auth.uid())
  )
);
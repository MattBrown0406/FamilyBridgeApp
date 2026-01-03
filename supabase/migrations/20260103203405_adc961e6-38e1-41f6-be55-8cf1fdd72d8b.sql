-- Create helper functions for the new admin/moderator permission system

-- Check if a user is a family admin or professional moderator
CREATE OR REPLACE FUNCTION public.is_family_admin_or_moderator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Check if user is the original family creator
CREATE OR REPLACE FUNCTION public.is_family_creator(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.families
    WHERE id = _family_id
      AND created_by = _user_id
  )
$$;

-- Check if user can manage admin roles (only the creator can)
CREATE OR REPLACE FUNCTION public.can_manage_family_admins(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.is_family_creator(_family_id, _user_id)
$$;

-- Check if user can approve things in family (admin, moderator, or professional moderator)
CREATE OR REPLACE FUNCTION public.can_approve_in_family(_family_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
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

-- Update RLS policies to allow admins alongside moderators

-- family_boundaries policies
DROP POLICY IF EXISTS "Moderators can update boundaries" ON public.family_boundaries;
CREATE POLICY "Admins and moderators can update boundaries" 
ON public.family_boundaries 
FOR UPDATE 
USING (public.can_approve_in_family(family_id, auth.uid()));

DROP POLICY IF EXISTS "Moderators can delete boundaries" ON public.family_boundaries;
CREATE POLICY "Admins and moderators can delete boundaries" 
ON public.family_boundaries 
FOR DELETE 
USING (public.can_approve_in_family(family_id, auth.uid()));

-- families policies
DROP POLICY IF EXISTS "Moderators can update their families" ON public.families;
CREATE POLICY "Admins and moderators can update their families" 
ON public.families 
FOR UPDATE 
USING (public.can_approve_in_family(id, auth.uid()))
WITH CHECK (public.can_approve_in_family(id, auth.uid()));

-- family_members policies
DROP POLICY IF EXISTS "Moderators can update member roles" ON public.family_members;
CREATE POLICY "Admins and moderators can update member roles" 
ON public.family_members 
FOR UPDATE 
USING (public.can_approve_in_family(family_id, auth.uid()));

-- family_values policies
DROP POLICY IF EXISTS "Moderators can insert values" ON public.family_values;
CREATE POLICY "Admins and moderators can insert values" 
ON public.family_values 
FOR INSERT 
WITH CHECK (public.can_approve_in_family(family_id, auth.uid()) AND auth.uid() = selected_by);

DROP POLICY IF EXISTS "Moderators can update values" ON public.family_values;
CREATE POLICY "Admins and moderators can update values" 
ON public.family_values 
FOR UPDATE 
USING (public.can_approve_in_family(family_id, auth.uid()));

DROP POLICY IF EXISTS "Moderators can delete values" ON public.family_values;
CREATE POLICY "Admins and moderators can delete values" 
ON public.family_values 
FOR DELETE 
USING (public.can_approve_in_family(family_id, auth.uid()));

-- family_common_goals policies
DROP POLICY IF EXISTS "Moderators can insert common goals" ON public.family_common_goals;
CREATE POLICY "Admins and moderators can insert common goals" 
ON public.family_common_goals 
FOR INSERT 
WITH CHECK (public.can_approve_in_family(family_id, auth.uid()) AND auth.uid() = selected_by);

DROP POLICY IF EXISTS "Moderators can update common goals" ON public.family_common_goals;
CREATE POLICY "Admins and moderators can update common goals" 
ON public.family_common_goals 
FOR UPDATE 
USING (public.can_approve_in_family(family_id, auth.uid()));

DROP POLICY IF EXISTS "Moderators can delete common goals" ON public.family_common_goals;
CREATE POLICY "Admins and moderators can delete common goals" 
ON public.family_common_goals 
FOR DELETE 
USING (public.can_approve_in_family(family_id, auth.uid()));

-- financial_requests policies
DROP POLICY IF EXISTS "Moderators can update financial requests" ON public.financial_requests;
CREATE POLICY "Admins and moderators can update financial requests" 
ON public.financial_requests 
FOR UPDATE 
USING (public.can_approve_in_family(family_id, auth.uid()));
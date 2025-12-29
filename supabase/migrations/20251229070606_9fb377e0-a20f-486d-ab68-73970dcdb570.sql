-- Drop the existing overly permissive SELECT policy
DROP POLICY IF EXISTS "Family members can view checkins" ON public.meeting_checkins;

-- Create new policy: Users can only view their own check-ins
CREATE POLICY "Users can view own checkins"
ON public.meeting_checkins
FOR SELECT
USING (auth.uid() = user_id);

-- Create policy: Moderators can view all check-ins in their families
CREATE POLICY "Moderators can view family checkins"
ON public.meeting_checkins
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.family_members
    WHERE family_members.family_id = meeting_checkins.family_id
      AND family_members.user_id = auth.uid()
      AND family_members.role = 'moderator'
  )
);
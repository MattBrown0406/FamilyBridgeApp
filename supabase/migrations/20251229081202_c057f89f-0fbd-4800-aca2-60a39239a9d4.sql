-- Add restrictive policy to require authentication for meeting_checkins table
CREATE POLICY "Require authentication for meeting_checkins"
ON public.meeting_checkins
AS RESTRICTIVE
FOR SELECT
TO authenticated
USING (true);
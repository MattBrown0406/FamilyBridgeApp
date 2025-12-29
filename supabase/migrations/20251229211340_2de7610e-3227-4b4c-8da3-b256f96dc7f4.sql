-- Remove the overly permissive "Require authentication for meeting_checkins" policy
-- This policy allows ANY authenticated user to read ALL meeting check-ins, which is a security issue
-- The table already has proper policies: "Users can view own checkins" and "Moderators can view family checkins"
DROP POLICY IF EXISTS "Require authentication for meeting_checkins" ON public.meeting_checkins;